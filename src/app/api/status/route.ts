import { NextResponse } from "next/server";

interface AwsStatusEntry {
  service_name: string;
  summary: string;
  status: number;
  details: string;
  date: string;
  service: string;
  archive?: boolean;
}

interface AwsStatusFeed {
  archive: AwsStatusEntry[];
  current: AwsStatusEntry[];
}

const SERVICES = [
  {
    id: "dynamodb",
    name: "Amazon DynamoDB",
    label: "DynamoDB",
    region: "us-east-2",
    regionLabel: "US East (Ohio)",
    matchTerms: ["dynamodb", "us east (ohio)", "us-east-2"],
  },
  {
    id: "s3",
    name: "Amazon S3",
    label: "Amazon S3",
    region: "us-east-2",
    regionLabel: "US East (Ohio)",
    matchTerms: ["s3", "simple storage", "us east (ohio)", "us-east-2"],
  },
  {
    id: "cognito",
    name: "Amazon Cognito",
    label: "Amazon Cognito",
    region: "us-east-2",
    regionLabel: "US East (Ohio)",
    matchTerms: ["cognito", "us east (ohio)", "us-east-2"],
  },
  {
    id: "ses",
    name: "Amazon SES",
    label: "Amazon SES",
    region: "us-east-2",
    regionLabel: "US East (Ohio)",
    matchTerms: ["ses", "simple email", "us east (ohio)", "us-east-2"],
  },
  {
    id: "amplify",
    name: "AWS Amplify",
    label: "AWS Amplify",
    region: "us-east-2",
    regionLabel: "US East (Ohio)",
    matchTerms: ["amplify", "us east (ohio)", "us-east-2"],
  },
] as const;

function getStatusLabel(code: number): "operational" | "degraded" | "outage" | "maintenance" {
  if (code === 0) return "operational";
  if (code === 1) return "maintenance";
  if (code === 2) return "degraded";
  return "outage";
}

function matchesService(entry: AwsStatusEntry, terms: readonly string[]): boolean {
  const haystack = (entry.service_name + " " + (entry.service || "")).toLowerCase();
  return terms.every((t) => haystack.includes(t.toLowerCase()));
}

export async function GET() {
  try {
    const res = await fetch("https://status.aws.amazon.com/data.json", {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`AWS status feed responded ${res.status}`);

    const feed: AwsStatusFeed = await res.json();
    const current = feed.current || [];
    const archive = (feed.archive || []).slice(0, 20);

    const services = SERVICES.map((svc) => {
      // Find the worst active incident for this service
      const matches = current.filter((e) => matchesService(e, svc.matchTerms));
      const worst = matches.reduce(
        (max, e) => (e.status > max ? e.status : max),
        0
      );
      const activeEntry = matches.find((e) => e.status === worst);

      // Look for recent resolved incidents in archive
      const recentArchive = archive
        .filter((e) => matchesService(e, svc.matchTerms))
        .slice(0, 3);

      return {
        id: svc.id,
        name: svc.label,
        fullName: svc.name,
        region: svc.region,
        regionLabel: svc.regionLabel,
        status: getStatusLabel(worst),
        statusCode: worst,
        message: activeEntry?.summary || "No incidents reported",
        activeIncidents: matches.map((e) => ({
          summary: e.summary,
          status: getStatusLabel(e.status),
          date: e.date,
        })),
        recentHistory: recentArchive.map((e) => ({
          summary: e.summary,
          status: getStatusLabel(e.status),
          date: e.date,
        })),
      };
    });

    // Current global incidents from the feed (not service-specific)
    const globalIncidents = current
      .filter((e) => {
        const lower = (e.service_name + " " + (e.service || "")).toLowerCase();
        return lower.includes("us east (ohio)") || lower.includes("us-east-2");
      })
      .slice(0, 5)
      .map((e) => ({
        serviceName: e.service_name,
        summary: e.summary,
        status: getStatusLabel(e.status),
        date: e.date,
      }));

    const overallOperational = services.every((s) => s.statusCode === 0);
    const hasOutage = services.some((s) => s.statusCode >= 3);
    const hasDegraded = services.some((s) => s.statusCode >= 2);

    return NextResponse.json(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        region: "us-east-2",
        regionLabel: "US East (Ohio)",
        overall: hasOutage ? "outage" : hasDegraded ? "degraded" : overallOperational ? "operational" : "maintenance",
        services,
        globalIncidents,
        feedSource: "https://status.aws.amazon.com",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to fetch AWS status feed",
        checkedAt: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}
