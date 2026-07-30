// Cloud-side resume indexing: shared helpers + the self-chaining background
// job that walks through every unindexed resume (bank files and application/
// bench resumes) without needing a browser tab to stay open.
//
// How the chain works: /api/resume-bank/index-all gathers the full worklist and
// fires the first hop. Each hop (/api/resume-bank/index-run) responds 202
// immediately, processes a small batch inside `after()` (so it fits one
// serverless invocation), then POSTs the remaining worklist back to itself with
// an internal key. Progress is stateless — the vector store itself is the
// record of what's done, so a broken chain resumes exactly where it left off
// the next time "Index all" is clicked.
//
// Server-side only (it touches S3, DynamoDB and the matching engine secret).
import { getResumeObject, parseResumeBankKey } from "./s3";
import { parseResumeBuffer } from "./resume-parser";
import { embedResume, resumesIndexed } from "./match-candidates";
import { getApplication, putBankResumeContact, putIndexJobState } from "./dynamodb";
import { analyzeApplicationResume } from "./analyze-application";

if (typeof window !== "undefined") {
  throw new Error("index-resumes.ts is server-only and must not run in the browser.");
}

export interface IndexJobPayload {
  bank: string[];  // resume-bank S3 keys still to index
  apps: string[];  // application ids still to index
  depth: number;   // hop counter (safety cap)
}

/** Hops process a small batch each so a single serverless invocation is enough. */
const HOP_BATCH = 3;
/** 374 bank files + every application is < 200 hops at batch 3; 500 is a generous runaway cap. */
const MAX_DEPTH = 500;

/** The shared secret hops use to authenticate to each other. Server-only env. */
export function indexChainKey(): string {
  return (process.env.RESUME_MATCH_API_KEY || "").trim();
}

export function deriveFileType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "doc") return "application/msword";
  return "application/octet-stream";
}

/** Parse + embed one resume-bank file so it becomes searchable. */
export async function indexBankFile(fileKey: string): Promise<{ indexed: boolean; error?: string }> {
  const meta = parseResumeBankKey(fileKey);
  const fileName = meta.fileName || fileKey.split("/").pop() || "resume";

  const object = await getResumeObject(fileKey);
  if (!object.success || !object.body) {
    return { indexed: false, error: object.notFound ? "File missing from storage" : object.error || "Could not read file" };
  }

  const parsed = await parseResumeBuffer(object.body, fileName, object.contentType || deriveFileType(fileName));
  if (!parsed.success || !parsed.analysis) {
    return { indexed: false, error: parsed.error || "Could not parse resume" };
  }

  // Bank files have no application record, so the parsed contact card is the
  // only identity we have — store it so matches can show a real name/email/
  // phone instead of "Unnamed candidate". Best-effort: indexing must not fail
  // over a contact write.
  const candidateName = meta.candidateName || parsed.contact?.name;
  if (parsed.contact) {
    await putBankResumeContact({
      id: fileKey,
      name: candidateName,
      email: parsed.contact.email,
      phone: parsed.contact.phone,
    }).catch((e) => console.error(`[index] contact card failed (non-fatal) for ${fileKey}:`, e));
  }

  const embedded = await embedResume({
    resumeId: fileKey,
    analysis: parsed.analysis,
    candidateName,
    source: "bank",
  });
  return embedded.success ? { indexed: true } : { indexed: false, error: embedded.error || "Indexing failed" };
}

/**
 * Index one application (talent-bench or regular applicant) so it shows up in
 * Lead Sourcing / Best candidates. Cheap path: an already-parsed analysis is
 * just re-embedded. Slow path: no analysis yet → run the full parse pipeline
 * (which embeds at the end).
 */
export async function indexApplication(applicationId: string): Promise<{ indexed: boolean; error?: string }> {
  const res = await getApplication(applicationId);
  if (!res.success || !res.data) return { indexed: false, error: "Application not found" };
  const app = res.data;

  if (app.resumeAnalysis) {
    const embedded = await embedResume({
      resumeId: app.id,
      analysis: app.resumeAnalysis,
      candidateName: app.name,
      source: "application",
    });
    return embedded.success ? { indexed: true } : { indexed: false, error: embedded.error };
  }

  if (app.resumeId) {
    const analyzed = await analyzeApplicationResume(app.id);
    return analyzed.success ? { indexed: true } : { indexed: false, error: analyzed.error };
  }

  return { indexed: false, error: "No resume or analysis on this application" };
}

/** `resumesIndexed` over an id list of any size (the engine call is chunked). */
export async function resumesIndexedChunked(ids: string[]): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  for (let i = 0; i < ids.length; i += 200) {
    Object.assign(out, await resumesIndexed(ids.slice(i, i + 200)));
  }
  return out;
}

/**
 * Process one hop of the indexing chain: a small batch in parallel, then hand
 * the remainder to the next hop. Failures are logged and dropped from the
 * worklist (never retried within the run) so one bad file can't wedge the chain.
 */
export async function processIndexHop(payload: IndexJobPayload, selfUrl: string): Promise<void> {
  // Applications first: bench candidates with a stored analysis are the
  // cheapest wins and what recruiters are waiting to see in Lead Sourcing.
  const fromApps = payload.apps.slice(0, HOP_BATCH);
  const fromBank = fromApps.length < HOP_BATCH ? payload.bank.slice(0, HOP_BATCH - fromApps.length) : [];

  await Promise.all([
    ...fromApps.map(async (id) => {
      try {
        const r = await indexApplication(id);
        if (!r.indexed) console.error(`[index-chain] application ${id}: ${r.error}`);
      } catch (e) {
        console.error(`[index-chain] application ${id}:`, e);
      }
    }),
    ...fromBank.map(async (key) => {
      try {
        const r = await indexBankFile(key);
        if (!r.indexed) console.error(`[index-chain] bank ${key}: ${r.error}`);
      } catch (e) {
        console.error(`[index-chain] bank ${key}:`, e);
      }
    }),
  ]);

  const rest: IndexJobPayload = {
    apps: payload.apps.slice(fromApps.length),
    bank: payload.bank.slice(fromBank.length),
    depth: payload.depth + 1,
  };

  // Heartbeat: keeps the run lock alive and gives the UI honest progress.
  await putIndexJobState(rest.apps.length + rest.bank.length);

  if (rest.apps.length + rest.bank.length === 0) {
    console.log(`[index-chain] complete after ${rest.depth} hops`);
    return;
  }
  if (rest.depth >= MAX_DEPTH) {
    console.error(`[index-chain] depth cap ${MAX_DEPTH} hit with ${rest.apps.length + rest.bank.length} items left`);
    await putIndexJobState(0);
    return;
  }

  try {
    // The next hop 202s before doing any work, so this await is quick — it only
    // confirms the baton was handed off, it does not wait for the whole chain.
    const res = await fetch(selfUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-index-key": indexChainKey() },
      body: JSON.stringify(rest),
    });
    if (!res.ok) console.error(`[index-chain] next hop refused: ${res.status}`);
  } catch (e) {
    console.error("[index-chain] failed to trigger next hop:", e);
  }
}
