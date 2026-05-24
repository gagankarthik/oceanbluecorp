"use client";
import JobDetailLoading from "./loading";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Edit3, Download, MapPin, DollarSign, Users, Briefcase,
  Building2, Calendar, AlertTriangle, Plus, Search,
  FileText, Hash, Check, Copy, UserCheck, Truck,
  ChevronDown, ExternalLink, ArrowLeft,
} from "lucide-react";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
import { CandidateEditDrawer } from "@/components/admin/candidate-edit-drawer";
import { usePageCrumb } from "@/components/admin/admin-provider";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminCard } from "@/components/admin/admin-card";
import { Avatar } from "@/components/admin/avatar";
import { tones, statusMeta, type Tone } from "@/components/admin/theme";
import { cn } from "@/lib/utils";

type Tab = "info" | "applicants";

// Status → tone + a top color stripe for the header card.
const JOB_TONE: Record<string, Tone> = {
  active: "emerald", open: "emerald", draft: "slate",
  "on-hold": "amber", paused: "amber", closed: "rose",
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = user?.role !== UserRole.RECRUITER;

  const [job, setJob]                     = useState<Job | null>(null);
  const [applications, setApplications]   = useState<Application[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<Tab>("info");
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [copied, setCopied]               = useState(false);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [editingApp, setEditingApp]       = useState<Application | null>(null);

  const debouncedSearch = useDebouncedValue(search, 250);
  const reduceMotion = useReducedMotion();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/applications?jobId=${jobId}`),
      ]);
      const [jobData, appsData] = await Promise.all([jobRes.json(), appsRes.json()]);
      if (!jobRes.ok) throw new Error(jobData.error || "Failed to fetch job");
      setJob(jobData.job);
      setApplications(appsData.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Show the job posting code (e.g. JOB-2026-0042) as the top-nav breadcrumb.
  usePageCrumb(job?.postingId);

  const handleStatusChange = async (appId: string, status: Application["status"]) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    try {
      await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch { void fetchData(); }
  };

  const handleExport = () => {
    const headers = ["Name", "Email", "Phone", "Status", "Applied", "Source", "Work Auth"];
    const rows = filteredApps.map((a) => [
      a.name, a.email, a.phone || "", a.status,
      new Date(a.appliedAt).toLocaleDateString(),
      a.source || "", a.workAuthorization || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${job?.title?.replace(/\s+/g, "_") || "job"}_applicants.csv`;
    a.click();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredApps = applications.filter((a) => {
    const q = debouncedSearch.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchS  = statusFilter === "all" || a.status === statusFilter;
    return matchQ && matchS;
  });

  const pipelineCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <JobDetailLoading />;

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-600">{error || "Job not found"}</p>
          <button onClick={() => router.push("/admin/jobs")} className="px-4 py-2 bg-[var(--hz-cobalt)] text-white text-sm rounded-lg hover:bg-[var(--hz-cobalt-600)]">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const tone = JOB_TONE[job.status] || "slate";
  const t = tones[tone];
  const statusLabel = statusMeta[job.status as keyof typeof statusMeta]?.label || job.status;

  const fadeUp = (i: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.06 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="space-y-4 pb-24">

      {/* ── Back (breadcrumb lives in the top nav) ── */}
      <button onClick={() => router.push("/admin/jobs")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-sm font-semibold text-slate-500 transition-all hover:border-slate-200 hover:bg-white hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </button>

      {/* ── Header card ── */}
      <motion.div {...fadeUp(0)}>
      <AdminCard className="overflow-hidden">
        {/* Status color stripe */}
        <div className={cn("h-[3px]", t.dot)} />

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Left: title + meta */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={job.status} label={statusLabel} size="md" />
                {job.postingId && (
                  <span className="inline-flex items-center gap-1 rounded border border-[var(--hz-cobalt-100)] bg-[var(--hz-cobalt-100)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--hz-cobalt)]">
                    <Hash className="h-3 w-3" />{job.postingId}
                  </span>
                )}
              </div>
              <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-slate-900">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {job.department && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                    {job.department}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  {job.location}{job.state ? `, ${job.state}` : ""}
                </span>
                {job.type && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                    {job.type.replace(/-/g, " ")}
                  </span>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <button onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              {canEdit && (
                <Link href={`/admin/jobs/${jobId}/edit`} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hz-cobalt)] px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-[rgba(29,78,216,0.2)] transition active:scale-[0.99] hover:bg-[var(--hz-cobalt-600)]">
                  <Edit3 className="h-3.5 w-3.5" />Edit
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-4 sm:divide-y-0">
          {([
            { icon: Users,      label: "Applicants", tone: "blue" as Tone,    value: applications.length.toString() },
            {
              icon: DollarSign,
              label: "Pay / Bill",
              tone: "emerald" as Tone,
              value: job.payRate
                ? `$${job.payRate}/hr${job.clientBillRate ? ` · $${job.clientBillRate}/hr bill` : ""}`
                : "—",
            },
            { icon: Building2, label: "Client", tone: "violet" as Tone, value: job.clientName || "—" },
            {
              icon: Calendar,
              label: "Deadline",
              tone: "amber" as Tone,
              value: job.submissionDueDate ? fmtDate(job.submissionDueDate) : "No deadline",
            },
          ]).map((item) => {
            const it = tones[item.tone];
            return (
              <div key={item.label} className="px-5 py-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={cn("grid h-6 w-6 place-items-center rounded-md", it.bg)}>
                    <item.icon className={cn("h-3.5 w-3.5", it.text)} />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</span>
                </div>
                <p className="truncate text-sm font-semibold tabular-nums text-slate-800">{item.value}</p>
              </div>
            );
          })}
        </div>
      </AdminCard>
      </motion.div>

      {/* ── Tabs card ── */}
      <motion.div {...fadeUp(1)}>
      <AdminCard className="overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 px-1">
          {([
            { id: "info" as Tab,       label: "Job Info",   count: undefined,            icon: FileText },
            { id: "applicants" as Tab, label: "Applicants", count: applications.length,  icon: Users    },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "border-[var(--hz-cobalt)] text-[var(--hz-cobalt)]"
                    : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
                    isActive ? "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]" : "bg-slate-100 text-slate-500",
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Job Info ── */}
        {activeTab === "info" && (
          <div className="space-y-6 p-6">
            {job.description && (
              <section>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{job.description}</p>
              </section>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <section>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Requirements</h3>
                <ul className="space-y-2">
                  {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--hz-cobalt)]" />
                      {req}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <section>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Responsibilities</h3>
                <ul className="space-y-2">
                  {(Array.isArray(job.responsibilities) ? job.responsibilities : [job.responsibilities]).map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(job.recruitmentManagerName || (job.assignedToNames && job.assignedToNames.length > 0)) && (
              <section>
                <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <UserCheck className="h-3.5 w-3.5" />Team
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {job.recruitmentManagerName && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--hz-cobalt-100)] bg-[var(--hz-cobalt-100)] px-3 py-2.5">
                      <Avatar name={job.recruitmentManagerName} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-[var(--hz-cobalt)]">{job.recruitmentManagerName}</p>
                        <p className="text-[10px] text-[var(--hz-cobalt)]">Recruitment Manager</p>
                      </div>
                    </div>
                  )}
                  {(job.assignedToNames || []).map((name, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <Avatar name={name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{name}</p>
                        <p className="text-[10px] text-slate-400">Assignee</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-5 lg:grid-cols-3">
              {[
                { label: "Client",       value: job.clientName,   icon: Building2  },
                { label: "Vendor",       value: job.vendorName,   icon: Truck      },
                {
                  label: "Salary range",
                  value: job.salary
                    ? `$${job.salary.min.toLocaleString()} – $${job.salary.max.toLocaleString()}`
                    : undefined,
                  icon: DollarSign,
                },
                { label: "Created",      value: fmtDate(job.createdAt), icon: Calendar  },
                { label: "Posted by",    value: job.postedByName, icon: UserCheck  },
                { label: "Client notes", value: job.clientNotes,  icon: FileText   },
              ].filter((d) => d.value).map((d) => (
                <div key={d.label}>
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <d.icon className="h-3.5 w-3.5" />{d.label}
                  </div>
                  <p className="text-sm text-slate-700">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Applicants ── */}
        {activeTab === "applicants" && (
          <div>
            {/* Pipeline filter */}
            {applications.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-5 pb-3 pt-4">
                {[
                  { key: "all",       label: "All",       count: applications.length            },
                  { key: "pending",   label: "New",       count: pipelineCounts["pending"]   || 0 },
                  { key: "reviewing", label: "Screening", count: pipelineCounts["reviewing"] || 0 },
                  { key: "submitted", label: "Submitted", count: pipelineCounts["submitted"] || 0 },
                  { key: "interview", label: "Interview", count: pipelineCounts["interview"] || 0 },
                  { key: "offered",   label: "Offered",   count: pipelineCounts["offered"]   || 0 },
                  { key: "hired",     label: "Hired",     count: pipelineCounts["hired"]     || 0 },
                  { key: "rejected",  label: "Rejected",  count: pipelineCounts["rejected"]  || 0 },
                ].map((s) => {
                  const isActive = statusFilter === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setStatusFilter(s.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        isActive ? "bg-[var(--hz-cobalt)] text-white shadow-sm shadow-[rgba(29,78,216,0.2)]" : "text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      {s.label}
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600",
                      )}>
                        {s.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div className="border-b border-slate-100 px-5 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm transition-colors focus:border-[var(--hz-cobalt)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)]"
                />
              </div>
            </div>

            {/* Rows or empty state */}
            {filteredApps.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100">
                  <Users className="h-7 w-7 text-slate-300" />
                </div>
                <p className="mb-1 text-base font-bold text-slate-700">No applicants yet</p>
                <p className="mb-5 text-sm text-slate-400">
                  {applications.length === 0 ? "Add the first applicant for this role." : "No applicants match your filter."}
                </p>
                {applications.length === 0 && (
                  <button
                    onClick={() => router.push(`/admin/applications/new?jobId=${jobId}`)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--hz-cobalt)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--hz-cobalt-600)]"
                  >
                    <Plus className="h-4 w-4" />Add Applicant
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <ApplicantRow
                    key={app.id}
                    app={app}
                    jobId={jobId}
                    onStatusChange={handleStatusChange}
                    onEdit={(a) => { setEditingApp(a); setDrawerOpen(true); }}
                  />
                ))}
              </div>
            )}

            {filteredApps.length > 0 && (
              <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">
                <span className="font-semibold text-slate-600 tabular-nums">{filteredApps.length}</span> of {applications.length} applicants
              </p>
            )}
          </div>
        )}
      </AdminCard>
      </motion.div>

      {/* ── Edit existing applicant (drawer only) ── */}
      <CandidateEditDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode="edit"
        candidate={editingApp}
        jobs={job ? [job] : []}
        defaultJobId={jobId}
        onSaved={(saved) => {
          setApplications((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
        }}
      />

      {/* ── Add Applicant FAB ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => router.push(`/admin/applications/new?jobId=${jobId}`)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-600)] active:bg-[var(--hz-cobalt)] text-white text-sm font-semibold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Applicant
        </button>
      </div>
    </div>
  );
}

// ── Applicant row ──────────────────────────────────────────────────────────────

function ApplicantRow({
  app, jobId, onStatusChange, onEdit,
}: {
  app: Application;
  jobId: string;
  onStatusChange: (id: string, status: Application["status"]) => void;
  onEdit: (app: Application) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const STATUSES: { value: Application["status"]; label: string }[] = [
    { value: "pending",   label: "New"       },
    { value: "reviewing", label: "Screening" },
    { value: "submitted", label: "Submitted" },
    { value: "interview", label: "Interview" },
    { value: "offered",   label: "Offered"   },
    { value: "hired",     label: "Hired"     },
    { value: "rejected",  label: "Rejected"  },
  ];

  return (
    <div className="px-5 py-4 hover:bg-slate-50/60 transition-colors group">
      <div className="flex items-center gap-4">

        {/* Avatar + name */}
        <button
          onClick={() => router.push(`/admin/candidates/${app.id}`)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <Avatar name={app.name || app.email} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[var(--hz-cobalt)] transition-colors">
              {app.name || "Unnamed"}
            </p>
            <p className="text-xs text-slate-400 truncate">{app.email}</p>
          </div>
        </button>

        {/* Location + source */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
          {app.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {app.city}{app.state ? `, ${app.state}` : ""}
            </span>
          )}
          {app.source && (
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{app.source}</span>
          )}
        </div>

        {/* Skills */}
        {app.skills && app.skills.length > 0 && (
          <div className="hidden lg:flex items-center gap-1">
            {app.skills.slice(0, 3).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] text-[10px] font-medium rounded-full border border-[var(--hz-cobalt-100)]">
                {s}
              </span>
            ))}
            {app.skills.length > 3 && (
              <span className="text-[10px] text-slate-400">+{app.skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Status badge */}
        <div className="flex-shrink-0">
          <StatusBadge status={app.status} />
        </div>

        {/* Date */}
        <span className="hidden flex-shrink-0 text-xs tabular-nums text-slate-400 sm:block">
          {fmtDate(app.appliedAt)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {/* Status change dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Change status"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white border border-slate-200/80 rounded-2xl shadow-lg overflow-hidden">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onStatusChange(app.id, s.value); setMenuOpen(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-xs text-left transition-colors hover:bg-slate-50",
                      app.status === s.value ? "font-semibold text-[var(--hz-cobalt)] bg-[#eef3fe]" : "text-slate-700",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Open/edit */}
          <button
            onClick={() => onEdit(app)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit applicant"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
