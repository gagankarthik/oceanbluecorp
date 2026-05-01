"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit3, Download, MapPin, DollarSign, Users, Briefcase,
  Building2, Calendar, Loader2, AlertTriangle, Plus, Search,
  FileText, Hash, Check, Copy, UserCheck, Truck,
  ChevronDown, ExternalLink, ChevronRight,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";
import { CandidateEditDrawer } from "@/components/admin/candidate-edit-drawer";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { cn } from "@/lib/utils";

type Tab = "info" | "applicants";

const JOB_STATUS: Record<string, { label: string; bg: string; text: string; dot: string; stripe: string }> = {
  active:    { label: "Active",  bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", stripe: "bg-emerald-400" },
  open:      { label: "Open",    bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", stripe: "bg-emerald-400" },
  draft:     { label: "Draft",   bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400",    stripe: "bg-gray-300"   },
  "on-hold": { label: "On Hold", bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   stripe: "bg-amber-400"  },
  paused:    { label: "Paused",  bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   stripe: "bg-amber-400"  },
  closed:    { label: "Closed",  bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500",    stripe: "bg-rose-400"   },
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
    const q = search.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchS  = statusFilter === "all" || a.status === statusFilter;
    return matchQ && matchS;
  });

  const pipelineCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-600">{error || "Job not found"}</p>
          <button onClick={() => router.push("/admin/jobs")} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const st = JOB_STATUS[job.status] || JOB_STATUS.draft;

  return (
    <div className="space-y-4 pb-24">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400">
        <button onClick={() => router.push("/admin/jobs")} className="hover:text-gray-700 transition-colors font-medium">
          Jobs
        </button>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-gray-700 font-medium truncate max-w-[260px] sm:max-w-sm">{job.title}</span>
      </nav>

      {/* ── Header card ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Status color stripe */}
        <div className={cn("h-[3px]", st.stripe)} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Left: title + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", st.bg, st.text)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", st.dot)} />
                  {st.label}
                </span>
                {job.postingId && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-semibold">
                    <Hash className="w-3 h-3" />{job.postingId}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{job.title}</h1>
              <div className="flex items-center gap-3 flex-wrap text-sm text-gray-500">
                {job.department && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {job.department}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {job.location}{job.state ? `, ${job.state}` : ""}
                </span>
                {job.type && (
                  <span className="capitalize bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-md">
                    {job.type.replace(/-/g, " ")}
                  </span>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={copyLink} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline text-sm">{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-sm">Export</span>
              </button>
              {canEdit && (
                <Link href={`/admin/jobs/${jobId}/edit`} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />Edit
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
          {[
            { icon: Users,      label: "Applicants", value: applications.length.toString() },
            {
              icon: DollarSign,
              label: "Pay / Bill",
              value: job.payRate
                ? `$${job.payRate}/hr${job.clientBillRate ? ` · $${job.clientBillRate}/hr bill` : ""}`
                : "—",
            },
            { icon: Building2, label: "Client",   value: job.clientName || "—" },
            {
              icon: Calendar,
              label: "Deadline",
              value: job.submissionDueDate
                ? new Date(job.submissionDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "No deadline",
            },
          ].map((item) => (
            <div key={item.label} className="px-5 py-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                <item.icon className="w-3.5 h-3.5" />{item.label}
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs card ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 px-1">
          {([
            { id: "info" as Tab,       label: "Job Info",                            icon: FileText },
            { id: "applicants" as Tab, label: `Applicants (${applications.length})`, icon: Users    },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Job Info ── */}
        {activeTab === "info" && (
          <div className="p-6 space-y-6">
            {job.description && (
              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </section>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-[7px] flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Responsibilities</h3>
                <ul className="space-y-2">
                  {(Array.isArray(job.responsibilities) ? job.responsibilities : [job.responsibilities]).map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-[7px] flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(job.recruitmentManagerName || (job.assignedToNames && job.assignedToNames.length > 0)) && (
              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />Team
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {job.recruitmentManagerName && (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                      <Avatar name={job.recruitmentManagerName} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-blue-800">{job.recruitmentManagerName}</p>
                        <p className="text-[10px] text-blue-500">Recruitment Manager</p>
                      </div>
                    </div>
                  )}
                  {(job.assignedToNames || []).map((name, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                      <Avatar name={name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{name}</p>
                        <p className="text-[10px] text-gray-400">Assignee</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-5 border-t border-gray-100">
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
                {
                  label: "Created",
                  value: new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                  icon: Calendar,
                },
                { label: "Posted by",    value: job.postedByName, icon: UserCheck  },
                { label: "Client notes", value: job.clientNotes,  icon: FileText   },
              ].filter((d) => d.value).map((d) => (
                <div key={d.label}>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    <d.icon className="w-3.5 h-3.5" />{d.label}
                  </div>
                  <p className="text-sm text-gray-700">{d.value}</p>
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
              <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex gap-1.5 flex-wrap">
                {[
                  { key: "all",       label: "All",       count: applications.length            },
                  { key: "pending",   label: "New",       count: pipelineCounts["pending"]   || 0 },
                  { key: "reviewing", label: "Screening", count: pipelineCounts["reviewing"] || 0 },
                  { key: "interview", label: "Interview", count: pipelineCounts["interview"] || 0 },
                  { key: "offered",   label: "Offered",   count: pipelineCounts["offered"]   || 0 },
                  { key: "hired",     label: "Hired",     count: pipelineCounts["hired"]     || 0 },
                  { key: "rejected",  label: "Rejected",  count: pipelineCounts["rejected"]  || 0 },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      statusFilter === s.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    {s.label}
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                      statusFilter === s.key ? "bg-white/20 text-white" : "bg-white text-gray-500 border border-gray-200",
                    )}>
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Rows or empty state */}
            {filteredApps.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-base font-semibold text-gray-700 mb-1">No applicants yet</p>
                <p className="text-sm text-gray-400 mb-5">
                  {applications.length === 0 ? "Add the first applicant for this role." : "No applicants match your filter."}
                </p>
                {applications.length === 0 && (
                  <button
                    onClick={() => router.push(`/admin/applications/new?jobId=${jobId}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />Add Applicant
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
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
              <p className="px-5 py-2.5 text-xs text-gray-400 border-t border-gray-100">
                {filteredApps.length} of {applications.length} applicants
              </p>
            )}
          </div>
        )}
      </div>

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
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
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
    { value: "interview", label: "Interview" },
    { value: "offered",   label: "Offered"   },
    { value: "hired",     label: "Hired"     },
    { value: "rejected",  label: "Rejected"  },
  ];

  return (
    <div className="px-5 py-4 hover:bg-gray-50/60 transition-colors group">
      <div className="flex items-center gap-4">

        {/* Avatar + name */}
        <button
          onClick={() => router.push(`/admin/candidates/${app.id}`)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <Avatar name={app.name || app.email} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {app.name || "Unnamed"}
            </p>
            <p className="text-xs text-gray-400 truncate">{app.email}</p>
          </div>
        </button>

        {/* Location + source */}
        <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
          {app.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {app.city}{app.state ? `, ${app.state}` : ""}
            </span>
          )}
          {app.source && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{app.source}</span>
          )}
        </div>

        {/* Skills */}
        {app.skills && app.skills.length > 0 && (
          <div className="hidden lg:flex items-center gap-1">
            {app.skills.slice(0, 3).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full border border-blue-100">
                {s}
              </span>
            ))}
            {app.skills.length > 3 && (
              <span className="text-[10px] text-gray-400">+{app.skills.length - 3}</span>
            )}
          </div>
        )}

        {/* Status badge */}
        <div className="flex-shrink-0">
          <StatusBadge status={app.status} />
        </div>

        {/* Date */}
        <span className="hidden sm:block text-xs text-gray-400 tabular-nums flex-shrink-0">
          {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {/* Status change dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Change status"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onStatusChange(app.id, s.value); setMenuOpen(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-xs text-left transition-colors hover:bg-gray-50",
                      app.status === s.value ? "font-semibold text-blue-600 bg-blue-50/60" : "text-gray-700",
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
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit applicant"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
