// One-time backfill: tag existing talent-bench records with a benchType pool.
//
// Rule (same fallback the UI applies while untagged rows still exist):
//   addToTalentBench === true and no benchType
//     -> "internal" when status === "hired" (they became one of our consultants)
//     -> "external" otherwise (market candidate kept warm)
//
// Usage:
//   node scripts/backfill-bench-type.mjs           # dry run — prints what it would do
//   node scripts/backfill-bench-type.mjs --apply   # actually writes
//
// Reads AWS credentials and the table name from .env.local (same variables the
// app uses: NEXT_AWS_ACCESS_KEY_ID, NEXT_AWS_SECRET_ACCESS_KEY,
// NEXT_PUBLIC_AWS_REGION, NEXT_AWS_DYNAMODB_TABLE_APPLICATIONS).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// Minimal .env.local loader — values already set in the environment win.
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
} catch {
  console.warn("No .env.local found — relying on the ambient environment.");
}

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
let updated = 0;
let lastKey;

do {
  const page = await client.send(new ScanCommand({
    TableName: TABLE,
    ExclusiveStartKey: lastKey,
    // Only bench rows that don't have a pool yet.
    FilterExpression: "addToTalentBench = :yes AND attribute_not_exists(benchType)",
    ExpressionAttributeValues: { ":yes": true },
  }));
  lastKey = page.LastEvaluatedKey;
  scanned += page.ScannedCount ?? 0;

  for (const item of page.Items ?? []) {
    const benchType = item.status === "hired" ? "internal" : "external";
    console.log(`${APPLY ? "SET" : "would set"} ${benchType.padEnd(8)} ${item.applicationId || item.id}  ${item.name || item.email || ""}`);
    if (APPLY) {
      await client.send(new UpdateCommand({
        TableName: TABLE,
        Key: { id: item.id },
        UpdateExpression: "SET benchType = :t",
        // Guard against a concurrent edit having set it between scan and write.
        ConditionExpression: "attribute_not_exists(benchType)",
        ExpressionAttributeValues: { ":t": benchType },
      })).catch((err) => {
        if (err.name === "ConditionalCheckFailedException") return;
        throw err;
      });
    }
    updated += 1;
  }
} while (lastKey);

console.log(`\nScanned ${scanned} rows; ${APPLY ? "updated" : "would update"} ${updated} bench records.`);
if (!APPLY) console.log("Dry run only — re-run with --apply to write.");
