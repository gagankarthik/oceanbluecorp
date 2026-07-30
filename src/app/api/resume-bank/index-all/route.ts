import { NextRequest, NextResponse, after } from "next/server";
import { listResumeBankObjects } from "@/lib/aws";
import {
  getAllApplications,
  getBankResumeContacts,
  getIndexJobState,
  putIndexJobState,
} from "@/lib/aws/dynamodb";
import {
  indexChainBaseUrl,
  indexChainKey,
  processIndexHop,
  resumesIndexedChunked,
} from "@/lib/aws/index-resumes";
import { requireStaff } from "@/lib/auth/verify";

// Gathering the worklist means an S3 listing, a table scan and chunked
// indexed-status checks — give it room beyond the default.
export const maxDuration = 120;

// POST /api/resume-bank/index-all
// Kick off cloud-side indexing of EVERYTHING that isn't searchable yet:
// resume-bank files plus application/bench resumes. Responds immediately;
// the work continues server-side as a self-chaining background job, so the
// user can close the page. Idempotent — already-indexed items are skipped,
// and re-clicking resumes a broken chain from wherever it stopped.
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  if (!indexChainKey()) {
    return NextResponse.json(
      { error: "RESUME_MATCH_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    // One chain at a time: a stale heartbeat (no hop in 5 minutes) counts as
    // dead and may be replaced, so a crashed chain never blocks a restart.
    const jobState = await getIndexJobState();
    if (
      jobState && jobState.remaining > 0 &&
      Date.now() - new Date(jobState.updatedAt).getTime() < 5 * 60_000
    ) {
      return NextResponse.json({
        started: false,
        alreadyRunning: true,
        remaining: jobState.remaining,
        message: `Indexing is already running in the cloud (${jobState.remaining} resumes left).`,
      });
    }

    const [bankList, appsResult] = await Promise.all([
      listResumeBankObjects(),
      getAllApplications(),
    ]);

    // Duplicate files (same name + size uploaded twice) are indexed ONCE — the
    // extra copy would cost a parse and surface the same candidate twice in
    // matches. The copies are reported so the UI can flag them for deletion;
    // an already-indexed copy wins so we never re-parse a healthy group.
    const groups = new Map<string, { key: string; size: number }[]>();
    for (const o of bankList.objects || []) {
      const fileName = o.key.split("--").pop() || o.key;
      const g = `${fileName.toLowerCase()}|${o.size}`;
      const list = groups.get(g) || [];
      list.push({ key: o.key, size: o.size });
      groups.set(g, list);
    }

    const bankKeys: string[] = [];
    let duplicateCopies = 0;
    // Peek at indexed status for everything first so the keeper of each
    // duplicate group is the copy that's already searchable, if any.
    const allBankKeys = (bankList.objects || []).map((o) => o.key);
    // Anything with a resume file or a stored analysis can be made searchable —
    // that includes bench profiles whose details were entered manually.
    const appIds = (appsResult.data || [])
      .filter((a) => a.resumeId || a.resumeAnalysis)
      .map((a) => a.id);

    const indexedMap = await resumesIndexedChunked([...allBankKeys, ...appIds]);

    // Keep one file per duplicate group (indexed copy preferred), count the rest.
    for (const list of groups.values()) {
      const keeper = list.find((f) => indexedMap[f.key]) || list[0];
      bankKeys.push(keeper.key);
      duplicateCopies += list.length - 1;
    }

    // Re-index bank files that were embedded before contact cards existed —
    // they show as "Unnamed candidate" in matches until re-parsed.
    const alreadyIndexed = bankKeys.filter((k) => indexedMap[k]);
    const contacts = await getBankResumeContacts(alreadyIndexed);
    const missingContact = alreadyIndexed.filter((k) => !contacts[k]);

    const bank = [...bankKeys.filter((k) => !indexedMap[k]), ...missingContact];
    const apps = appIds.filter((id) => !indexedMap[id]);

    if (bank.length + apps.length === 0) {
      return NextResponse.json({
        started: false,
        bank: 0,
        applications: 0,
        duplicateCopies,
        message: "Everything is already indexed.",
      });
    }

    await putIndexJobState(bank.length + apps.length);
    const selfUrl = `${indexChainBaseUrl(request.nextUrl.origin)}/api/resume-bank/index-run`;
    after(() => processIndexHop({ bank, apps, depth: 0 }, selfUrl));

    return NextResponse.json(
      { started: true, bank: bank.length, applications: apps.length, duplicateCopies },
      { status: 202 },
    );
  } catch (e) {
    console.error("[index-all]", e);
    return NextResponse.json({ error: "Failed to start indexing" }, { status: 500 });
  }
}
