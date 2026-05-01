"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  Database,
  HardDrive,
  Mail,
  Shield,
  Zap,
  Info,
  Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type StatusLevel = "operational" | "degraded" | "outage" | "maintenance" | "unknown";

interface Incident {
  summary: string;
  status: StatusLevel;
  date: string;
}

interface ServiceResult {
  id: string;
  name: string;
  fullName: string;
  region: string;
  regionLabel: string;
  status: StatusLevel;
  statusCode: number;
  message: string;
  activeIncidents: Incident[];
  recentHistory: Incident[];
}

interface StatusData {
  ok: boolean;
  checkedAt: string;
  region: string;
  regionLabel: string;
  overall: StatusLevel;
  services: ServiceResult[];
  globalIncidents: {
    serviceName: string;
    summary: string;
    status: StatusLevel;
    date: string;
  }[];
  feedSource: string;
  error?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dynamodb: Database,
  s3: HardDrive,
  cognito: Shield,
  ses: Mail,
  amplify: Zap,
};

const STATUS_CONFIG: Record<StatusLevel, {
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  operational: {
    label: "Operational",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
    icon: CheckCircle2,
  },
  maintenance: {
    label: "Maintenance",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    dotColor: "bg-blue-500",
    icon: Info,
  },
  degraded: {
    label: "Degraded",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-500",
    icon: AlertTriangle,
  },
  outage: {
    label: "Outage",
    textColor: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    dotColor: "bg-rose-500",
    icon: XCircle,
  },
  unknown: {
    label: "Unknown",
    textColor: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    dotColor: "bg-gray-400",
    icon: Info,
  },
};

const OVERALL_BANNER: Record<StatusLevel, { bg: string; text: string; sub: string }> = {
  operational: {
    bg: "bg-emerald-600",
    text: "All Systems Operational",
    sub: "All AWS services are running normally in US East (Ohio).",
  },
  maintenance: {
    bg: "bg-blue-600",
    text: "Scheduled Maintenance",
    sub: "Some services have scheduled maintenance in progress.",
  },
  degraded: {
    bg: "bg-amber-500",
    text: "Partial Degradation",
    sub: "One or more services are experiencing degraded performance.",
  },
  outage: {
    bg: "bg-rose-600",
    text: "Service Disruption",
    sub: "One or more services are experiencing a significant outage.",
  },
  unknown: {
    bg: "bg-gray-500",
    text: "Status Unknown",
    sub: "Unable to determine current service status.",
  },
};

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return dateStr;
  }
}

function StatusPill({ status }: { status: StatusLevel }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bgColor} ${cfg.textColor}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function PulseDot({ status }: { status: StatusLevel }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const isIssue = status === "degraded" || status === "outage";
  return (
    <span className="relative flex h-2.5 w-2.5">
      {isIssue && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dotColor} opacity-60`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.dotColor}`} />
    </span>
  );
}

// ── Service Card ───────────────────────────────────────────────────────────────

function ServiceCard({ svc }: { svc: ServiceResult }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[svc.status] || STATUS_CONFIG.unknown;
  const Icon = SERVICE_ICONS[svc.id] || Database;
  const hasHistory = svc.activeIncidents.length > 0 || svc.recentHistory.length > 0;

  return (
    <div className={`bg-white rounded-2xl border ${cfg.borderColor} shadow-sm overflow-hidden transition-shadow hover:shadow-md`}>
      {/* Top accent */}
      <div className={`h-1 ${
        svc.status === "operational" ? "bg-emerald-400" :
        svc.status === "maintenance" ? "bg-blue-400" :
        svc.status === "degraded" ? "bg-amber-400" : "bg-rose-500"
      }`} />

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bgColor}`}>
              <Icon className={`w-4.5 h-4.5 ${cfg.textColor}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{svc.regionLabel} · {svc.region}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PulseDot status={svc.status} />
            <StatusPill status={svc.status} />
          </div>
        </div>

        {svc.activeIncidents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{svc.activeIncidents[0].summary}</p>
          </div>
        )}

        {hasHistory && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {expanded ? "Hide details" : `View ${svc.activeIncidents.length + svc.recentHistory.length} event(s)`}
          </button>
        )}

        {expanded && hasHistory && (
          <div className="mt-3 space-y-2">
            {[...svc.activeIncidents, ...svc.recentHistory].map((inc, i) => (
              <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5 text-xs space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <StatusPill status={inc.status} />
                  <span className="text-gray-400">{formatDate(inc.date)}</span>
                </div>
                <p className="text-gray-600 leading-relaxed mt-1">{inc.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const REFRESH_INTERVAL = 60;

export default function StatusContent() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      const json: StatusData = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          void fetchStatus();
          return REFRESH_INTERVAL;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const overall = data?.overall ?? "unknown";
  const banner = OVERALL_BANNER[overall];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overall status banner */}
      <div className={`${banner.bg} py-10 px-4`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1.5">
            {overall === "operational" ? (
              <CheckCircle2 className="w-8 h-8 text-white/90" />
            ) : overall === "outage" ? (
              <XCircle className="w-8 h-8 text-white/90" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-white/90" />
            )}
            <h1 className="text-2xl font-bold text-white">{banner.text}</h1>
          </div>
          <p className="text-white/75 text-sm ml-11">{banner.sub}</p>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">AWS Services</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Region: <span className="font-medium text-gray-700">us-east-2 (Ohio)</span>
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Refreshes in {countdown}s
            </span>
            <button
              onClick={() => void fetchStatus(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* Service grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm h-28 animate-pulse" />
            ))}
          </div>
        ) : !data?.ok ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center">
            <XCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Could not fetch status data</p>
            <p className="text-xs text-gray-400 mt-1">
              The AWS status feed may be temporarily unavailable. Try refreshing.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.services.map((svc) => (
              <ServiceCard key={svc.id} svc={svc} />
            ))}
          </div>
        )}

        {/* Active incidents */}
        {data?.globalIncidents && data.globalIncidents.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-amber-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900">Active Incidents in US East (Ohio)</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {data.globalIncidents.map((inc, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{inc.serviceName}</p>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{inc.summary}</p>
                    </div>
                    <StatusPill status={inc.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(inc.date)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {data && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-gray-200 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Last checked: {formatDate(data.checkedAt)}
            </span>
            <Link
              href={data.feedSource ?? "https://status.aws.amazon.com/data.json"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-gray-600 transition-colors"
            >
              Data source: AWS Service Health Dashboard
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
