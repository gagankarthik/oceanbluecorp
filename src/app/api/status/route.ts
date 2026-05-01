import { NextResponse } from "next/server";

interface EventLogEntry {
  summary: string;
  message: string;
  status: number;
  timestamp: number;
}

interface ImpactedService {
  service_name: string;
  current: string;
  max: string;
}

interface AwsEvent {
  date: string;
  arn: string;
  region_name: string;
  status: string;
  service: string;
  service_name: string;
  summary: string;
  event_log: EventLogEntry[];
  impacted_services: Record<string, ImpactedService>;
}

const TRACKED_SERVICES = [
  { id: "dynamodb", key: "dynamodb-us-east-2", label: "Amazon DynamoDB", category: "Database" },
  { id: "s3",       key: "s3-us-east-2",        label: "Amazon S3",       category: "Storage" },
  { id: "cognito",  key: "cognito-us-east-2",    label: "Amazon Cognito",  category: "Auth" },
  { id: "ses",      key: "ses-us-east-2",        label: "Amazon SES",      category: "Email" },
  { id: "amplify",  key: "amplify-us-east-2",    label: "AWS Amplify",     category: "Hosting" },
] as const;

// Try multiple URLs in order — AWS redirects the legacy URL
const FEED_URLS = [
  "https://health.aws.amazon.com/public/currentevents",
  "https://status.aws.amazon.com/data.json",
];

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchFeed(): Promise<AwsEvent[]> {
  let lastError: Error | null = null;

  for (const url of FEED_URLS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          Accept: "application/json, text/plain, */*",
          // Disable compression so arrayBuffer() gets raw bytes, not gzip magic bytes
          "Accept-Encoding": "identity",
          "User-Agent": BROWSER_UA,
          "Cache-Control": "no-cache",
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} from ${url}`);
        continue;
      }

      // AWS status feed returns UTF-16 LE with a BOM.
      // We request Accept-Encoding: identity so the buffer is uncompressed,
      // then detect the BOM and decode accordingly.
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      let text: string;
      if (bytes[0] === 0xff && bytes[1] === 0xfe) {
        // UTF-16 LE BOM
        const decoded = new TextDecoder("utf-16le").decode(buffer);
        text = decoded.charCodeAt(0) === 0xfeff ? decoded.slice(1) : decoded;
      } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
        // UTF-16 BE BOM (unlikely but handle it)
        const decoded = new TextDecoder("utf-16be").decode(buffer);
        text = decoded.charCodeAt(0) === 0xfeff ? decoded.slice(1) : decoded;
      } else {
        text = new TextDecoder("utf-8").decode(buffer);
      }

      // Guard: if AWS returned an HTML error page instead of JSON
      const trimmed = text.trimStart();
      if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) {
        lastError = new Error(`Non-JSON response from ${url}: ${text.slice(0, 120)}`);
        continue;
      }

      const data = JSON.parse(text);
      // The feed is an array of events
      return Array.isArray(data) ? data : [];
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("All status feed URLs failed");
}

function codeToStatus(code: string | number): "operational" | "degraded" | "outage" | "investigating" {
  const n = typeof code === "string" ? parseInt(code, 10) : code;
  if (n === 1) return "investigating";
  if (n === 2) return "degraded";
  if (n >= 3) return "outage";
  return "operational";
}

export async function GET() {
  try {
    const events = await fetchFeed();

    // Events touching us-east-2
    const ohioEvents = events.filter(
      (e) =>
        e.service?.includes("us-east-2") ||
        e.service?.includes("us-east") ||
        e.region_name?.toLowerCase().includes("ohio") ||
        Object.keys(e.impacted_services ?? {}).some((k) => k.includes("us-east-2"))
    );

    // Worst status per tracked service key
    const serviceImpact: Record<string, { status: string; eventSummary: string; logs: EventLogEntry[] }> = {};
    for (const ev of ohioEvents) {
      for (const [svcKey, svcData] of Object.entries(ev.impacted_services ?? {})) {
        if (!svcKey.includes("us-east-2")) continue;
        const existing = serviceImpact[svcKey];
        const cur = parseInt(svcData.current, 10) || 0;
        const prev = existing ? parseInt(existing.status, 10) : 0;
        if (!existing || cur > prev) {
          serviceImpact[svcKey] = {
            status: svcData.current,
            eventSummary: ev.summary,
            logs: ev.event_log ?? [],
          };
        }
      }
    }

    const services = TRACKED_SERVICES.map((svc) => {
      const impact = serviceImpact[svc.key];
      const statusCode = impact ? parseInt(impact.status, 10) : 0;
      return {
        id: svc.id,
        key: svc.key,
        label: svc.label,
        category: svc.category,
        status: codeToStatus(statusCode),
        statusCode,
        message: impact?.eventSummary ?? null,
        recentLogs: (impact?.logs ?? []).slice(-3).reverse().map((l) => ({
          summary: l.summary,
          message: l.message,
          status: codeToStatus(l.status),
          time: l.timestamp * 1000,
        })),
      };
    });

    const activeIncidents = ohioEvents.map((ev) => ({
      arn: ev.arn,
      regionName: ev.region_name,
      service: ev.service,
      serviceName: ev.service_name,
      summary: ev.summary,
      status: codeToStatus(ev.status),
      statusCode: parseInt(ev.status, 10) || 0,
      startedAt: parseInt(ev.date, 10) * 1000,
      log: (ev.event_log ?? [])
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map((l) => ({
          summary: l.summary,
          message: l.message,
          status: codeToStatus(l.status),
          time: l.timestamp * 1000,
        })),
    }));

    const worstCode = services.reduce((m, s) => Math.max(m, s.statusCode), 0);

    return NextResponse.json(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        region: "us-east-2",
        regionLabel: "US East (Ohio)",
        overall: codeToStatus(worstCode),
        services,
        activeIncidents,
        totalEvents: events.length,
        ohioEvents: ohioEvents.length,
        feedSource: "https://status.aws.amazon.com",
      },
      {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/status]", message);
    return NextResponse.json(
      { ok: false, error: message, checkedAt: new Date().toISOString() },
      { status: 502 }
    );
  }
}
