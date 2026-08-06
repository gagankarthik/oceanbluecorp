// One-time setup: create the recruiting-pipeline table.
//
// Holds submissions, interviews and placements in one table behind a `kind`
// discriminator — see the PIPELINE section in src/lib/aws/dynamodb.ts for why.
//
// Two indexes, one per access pattern the app has:
//   applicationId-index  everything recorded against one candidate
//   kind-date-index      everything of one kind in a date window (reporting)
//
// Usage:
//   node scripts/create-pipeline-table.mjs           # dry run — prints the definition
//   node scripts/create-pipeline-table.mjs --apply   # actually creates it
//
// Idempotent: an existing table is reported and left untouched, never altered.
//
// Reads AWS credentials and the table name from .env.local (the same variables
// the app uses: NEXT_AWS_ACCESS_KEY_ID, NEXT_AWS_SECRET_ACCESS_KEY,
// NEXT_PUBLIC_AWS_REGION, NEXT_AWS_DYNAMODB_TABLE_PIPELINE).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

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

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2";
const TABLE = process.env.NEXT_AWS_DYNAMODB_TABLE_PIPELINE || "oceanblue-pipeline";
const APPLY = process.argv.includes("--apply");

const definition = {
  TableName: TABLE,
  // On-demand: pipeline writes are a handful per recruiter per day, and provisioned
  // capacity on a table this quiet is money spent on nothing.
  BillingMode: "PAY_PER_REQUEST",
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "applicationId", AttributeType: "S" },
    { AttributeName: "kind", AttributeType: "S" },
    { AttributeName: "occurredAt", AttributeType: "S" },
  ],
  KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
  GlobalSecondaryIndexes: [
    {
      IndexName: "applicationId-index",
      KeySchema: [
        { AttributeName: "applicationId", KeyType: "HASH" },
        { AttributeName: "occurredAt", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "kind-date-index",
      KeySchema: [
        { AttributeName: "kind", KeyType: "HASH" },
        { AttributeName: "occurredAt", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
  ],
};

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
  },
});

async function main() {
  console.log(`Region: ${REGION}`);
  console.log(`Table:  ${TABLE}\n`);
  console.log(JSON.stringify(definition, null, 2));

  // Already there? Say so and stop. Re-running must never touch a live table.
  try {
    const existing = await client.send(new DescribeTableCommand({ TableName: TABLE }));
    const indexes = (existing.Table?.GlobalSecondaryIndexes || []).map((i) => i.IndexName);
    console.log(`\nTable already exists (status ${existing.Table?.TableStatus}).`);
    console.log(`Indexes present: ${indexes.join(", ") || "none"}`);
    for (const wanted of ["applicationId-index", "kind-date-index"]) {
      if (!indexes.includes(wanted)) {
        console.warn(
          `\nMISSING INDEX: ${wanted}. Add it in the DynamoDB console — this script ` +
          `will not alter a table that already holds data.`
        );
      }
    }
    return;
  } catch (err) {
    if (err.name !== "ResourceNotFoundException") throw err;
  }

  if (!APPLY) {
    console.log("\nDry run. Nothing was created. Re-run with --apply to create it.");
    return;
  }

  await client.send(new CreateTableCommand(definition));
  console.log(`\nCreated ${TABLE}. It becomes ACTIVE within a few seconds.`);

  // Wait for ACTIVE so a follow-up write cannot race table creation.
  for (let i = 0; i < 30; i++) {
    const described = await client.send(new DescribeTableCommand({ TableName: TABLE }));
    const status = described.Table?.TableStatus;
    const indexesReady = (described.Table?.GlobalSecondaryIndexes || [])
      .every((idx) => idx.IndexStatus === "ACTIVE");
    if (status === "ACTIVE" && indexesReady) {
      console.log("Table and indexes are ACTIVE.");
      return;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log("Still creating — check the console if writes fail in the next minute.");
}

main().catch((err) => {
  console.error(`\nFailed: ${err.name}: ${err.message}`);
  process.exit(1);
});
