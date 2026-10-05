import { NextRequest, NextResponse, after } from "next/server";
import { listResumeBankObjects } from "@/lib/aws";
import {
  cancelIndexJobState,
  getAllApplications,
  getBankResumeContacts,
  getIndexJobState,
  startIndexJobState,
} from "@/lib/aws/dynamodb";
import {
  indexChainBaseUrl,
  indexChainKey,
  processIndexHop,
  resumesIndexedChunked,
} from "@/lib/aws/index-resumes";
import { parseResumeBankKey } from "@/lib/aws/s3";
import { requireStaff } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";
import { indexJobBusy, indexJobPhase } from "@/lib/index-job";
import { findDuplicateGroups, keysToIndex } from "@/lib/resume-duplicates";

// Gathering the worklist means an S3 listing, a table scan and chunked
// indexed-status checks, give it room beyond the default.
export const maxDuration = 120;

// GET /api/resume-bank/index-all
// Where the cloud run stands: phase, progress, and which files failed and why.
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const state = await getIndexJobState();
  return NextResponse.json({
    phase: indexJobPhase(state),
    remaining: state?.remaining ?? 0,
    total: state?.total ?? 0,
    startedAt: state?.startedAt ?? null,
    updatedAt: state?.updatedAt ?? null,
    failed: state?.failed ?? [],
  });
}

// DELETE /api/resume-bank/index-all
// Stop the run. The next hop sees the flag and ends; files already indexed stay.
export async function DELETE(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const state = await getIndexJobState();
  if (!indexJobBusy(indexJobPhase(state))) {
    return NextResponse.json({ stopped: false, message: "Nothing is indexing right now." });
  }
  await cancelIndexJobState();
  return NextResponse.json({ stopped: true });
}

// POST /api/resume-bank/index-all   body: { retryFailed?: boolean }
// Kick off cloud-side indexing of everything that isn't searchable yet: bank
// files plus application/bench resumes, or with `retryFailed` only the files
// the last run failed on. Responds immediately; the work continues server-side
// as a self-chaining background job, so the page can be closed. Idempotent:
// indexed items are skipped, and a stalled chain is replaced.
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  if (!indexChainKey()) {
    return NextResponse.json(
      { error: "RESUME_MATCH_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const retryFailed = body?.retryFailed === true;

  try {
    // One chain at a time. A stalled chain (no heartbeat in 5 minutes) is
    // presumed dead and may be replaced, so a crash never blocks a restart.
    const jobState = await getIndexJobState();
    if (indexJobBusy(indexJobPhase(jobState))) {
      return NextResponse.json({
        started: false,
        alreadyRunning: true,
        remaining: jobState?.remaining ?? 0,
        message: `Indexing is already running in the cloud (${jobState?.remaining ?? 0} resumes left).`,
      });
    }

    const selfUrl = `${indexChainBaseUrl(request.nextUrl.origin)}/api/resume-bank/index-run`;

    if (retryFailed) {
      const failed = [...new Set((jobState?.failed ?? []).map((f) => f.id))];
      const bank = failed.filter((id) => id.startsWith("resume-bank/"));
      const apps = failed.filter((id) => !id.startsWith("resume-bank/"));
      if (bank.length + apps.length === 0) {
        return NextResponse.json({ started: false, bank: 0, applications: 0, message: "No failed files to retry." });
      }
      await startIndexJobState(bank.length + apps.length);
      after(() => processIndexHop({ bank, apps, depth: 0 }, selfUrl));
      return NextResponse.json({ started: true, bank: bank.length, applications: apps.length }, { status: 202 });
    }

    const [bankList, appsResult] = await Promise.all([
      listResumeBankObjects(),
      getAllApplications(),
    ]);

    // Anything with a resume file or a stored analysis can be made searchable,
    // that includes bench profiles whose details were entered manually.
    const appIds = (appsResult.data || [])
      .filter((a) => a.resumeId || a.resumeAnalysis)
      .map((a) => a.id);
    const objects = bankList.objects || [];
    const indexedMap = await resumesIndexedChunked([...objects.map((o) => o.key), ...appIds]);

    // Duplicate files are indexed once (same keeper rule as the bank page): an
    // extra copy would cost a parse and show the same candidate twice.
    const files = objects.map((o) => ({
      key: o.key,
      fileName: parseResumeBankKey(o.key).fileName,
      size: o.size,
      uploadedAt: o.lastModified.getTime(),
      indexed: !!indexedMap[o.key],
    }));
    const bankKeys = keysToIndex(files);
    const duplicateCopies = findDuplicateGroups(files).reduce((n, g) => n + g.extras.length, 0);

    // Re-index bank files that were embedded before contact cards existed,
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

    await startIndexJobState(bank.length + apps.length);
    after(() => processIndexHop({ bank, apps, depth: 0 }, selfUrl));

    return NextResponse.json(
      { started: true, bank: bank.length, applications: apps.length, duplicateCopies },
      { status: 202 },
    );
  } catch (e) {
    return serverError("[index-all]", e, "Couldn't start indexing. Please try again.");
  }
}
