// One-time backfill: write emailKey and nameKey on existing applications so the
// emailKey-index and nameKey-index cover them. New writes set both already.
//
// Keys come from src/lib/application-input.ts, the same functions the app uses.
// Only the two key attributes are touched; updatedAt is left alone.
//
// Usage:
//   node scripts/backfill-search-keys.mjs           # dry run
//   node scripts/backfill-search-keys.mjs --apply   # writes

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env.local loader; values already set in the environment win.
try {
  const env = readFileSync(resolve(root, ".env.local"), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
} catch {
  console.warn("No .env.local found; relying on the ambient environment.");
}

const jiti = createJiti(import.meta.url, { alias: { "@": resolve(root, "src") }, interopDefault: true });
const { emailKeyOf, nameKeyOf } = jiti(resolve(root, "src/lib/application-input.ts"));

const APPLY = process.argv.includes("--apply");
const TABLE = process.env.NEXT_AWS_DYNAMODB_TABLE_APPLICATIONS || "oceanblue-applications";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
  },
}));

let scanned = 0;
let changed = 0;
let lastKey;

do {
  const page = await client.send(new ScanCommand({
    TableName: TABLE,
    ExclusiveStartKey: lastKey,
    ProjectionExpression: "id, email, #n, firstName, lastName, emailKey, nameKey",
    ExpressionAttributeNames: { "#n": "name" },
  }));
  lastKey = page.LastEvaluatedKey;
  scanned += page.Items?.length ?? 0;

  for (const item of page.Items ?? []) {
    const emailKey = emailKeyOf(item.email);
    const nameKey = nameKeyOf(item);
    if (emailKey === item.emailKey && nameKey === item.nameKey) continue;

    const set = [];
    const remove = [];
    const values = {};
    if (emailKey) { set.push("emailKey = :e"); values[":e"] = emailKey; } else if (item.emailKey) remove.push("emailKey");
    if (nameKey) { set.push("nameKey = :n"); values[":n"] = nameKey; } else if (item.nameKey) remove.push("nameKey");
    if (!set.length && !remove.length) continue;

    changed++;
    console.log(`${APPLY ? "update" : "would update"} ${item.id}: email=${emailKey ?? "-"} name=${nameKey ?? "-"}`);
    if (!APPLY) continue;

    await client.send(new UpdateCommand({
      TableName: TABLE,
      Key: { id: item.id },
      UpdateExpression: [set.length ? `SET ${set.join(", ")}` : "", remove.length ? `REMOVE ${remove.join(", ")}` : ""].filter(Boolean).join(" "),
      ConditionExpression: "attribute_exists(id)",
      ...(Object.keys(values).length && { ExpressionAttributeValues: values }),
    }));
  }
} while (lastKey);

console.log(`\nScanned ${scanned}, ${APPLY ? "updated" : "would update"} ${changed}.`);
