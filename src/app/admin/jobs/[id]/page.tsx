"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit3, Download, MapPin, DollarSign, Users, Briefcase,
  Building2, Calendar, Loader2, AlertTriangle, Plus, Search,
  Star, FileText, Hash, Check, Copy, UserCheck, Truck, Clock,
  ChevronDown, MoreHorizontal, ExternalLink, Bookmark,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";
import { CandidateEditDrawer } from "@/components/admin/candidate-edit-drawer";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { cn } from "@/lib/utils";

// ── Tab definition ─────────────────────────────────────────────────────────────

type Tab = "info" | "applicants" | "add";

// ── Status config ─────────────────────────────────────────────────────────────

const JOB_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  active:   { label: "Active",   color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  open:     { label: "Open",     color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  draft:    { label: "Draft",    color: "bg-gray-100 text-gray-600",       dot: "bg-gray-400"    },
  "on-hold":{ label: "On Hold",  color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  paused:   { label: "Paused",   color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  closed:   { label: "Closed",   color: "bg-rose-100 text-rose-700",       dot: "bg-rose-500"    },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = user?.role !== UserRole.RECRUITER;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState(false);

  // Add applicant drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

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
    const matchS = statusFilter === "all" || a.status === statusFilter;
    return matchQ && matchS;
  });

  const pipelineCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading job…</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-600">{error || "Job not found"}</p>
          <button onClick={() => router.push("/admin/jobs")} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Back to Jobs</button>
        </div>
      </div>
    );
  }

  const jobStatus = JOB_STATUS[job.status] || JOB_STATUS.draft;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push("/admin/jobs")} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", jobStatus.color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", jobStatus.dot)} />
                {jobStatus.label}
              </span>
              {job.postingId && (
                <span className="font-mono text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Hash className="w-3 h-3" />{job.postingId}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {job.department && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />{job.department}
                </span>
              )}
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />{job.location}{job.state ? `, ${job.state}` : ""}
              </span>
              <span className="text-xs text-gray-500 capitalize">{job.type?.replace(/-/g, " ")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={copyLink} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          {canEdit && (
            <Link href={`/admin/jobs/${jobId}/edit`} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Edit3 className="w-4 h-4" />Edit
            </Link>
          )}
        </div>
      </div>

      {/* ── Quick info cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: Users,     label: "Applicants",   value: applications.length.toString()                },
          { icon: DollarSign,label: "Pay Rate",      value: job.payRate ? `$${job.payRate}/hr` : "—"    },
          { icon: DollarSign,label: "Bill Rate",     value: job.clientBillRate ? `$${job.clientBillRate}/hr` : "—" },
          { icon: Building2, label: "Client",        value: job.clientName || "—"                        },
          { icon: Calendar,  label: "Deadline",      value: job.submissionDueDate ? new Date(job.submissionDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "None" },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 mb-1">
              <card.icon className="w-3.5 h-3.5" />
              {card.label}
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 px-4">
          {([
            { id: "info" as Tab,       label: "Job Info",   icon: FileText },
            { id: "applicants" as Tab, label: `Applicants (${applications.length})`, icon: Users },
            { id: "add" as Tab,        label: "Add Applicant", icon: Plus },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "add") {
                  setEditingApp(null);
                  setDrawerOpen(true);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors",
                tab.id !== "add" && activeTab === tab.id
                  ? "text-blue-600 border-blue-600"
                  : tab.id === "add"
                    ? "text-blue-600 border-transparent hover:text-blue-700 hover:bg-blue-50/50"
                    : "text-gray-500 border-transparent hover:text-gray-700",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Job Info tab ── */}
        {activeTab === "info" && (
          <div className="p-5 space-y-6">
            {/* Description */}
            {job.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Requirements</h3>
                <ul className="space-y-1.5">
                  {(Array.isArray(job.requirements) ? job.requirements : [job.requirements]).map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Responsibilities</h3>
                <ul className="space-y-1.5">
                  {(Array.isArray(job.responsibilities) ? job.responsibilities : [job.responsibilities]).map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Team assignments */}
            {(job.recruitmentManagerName || (job.assignedToNames && job.assignedToNames.length > 0)) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />Team Assignments
                </h3>
                <div className="flex flex-wrap gap-3">
                  {job.recruitmentManagerName && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <Avatar name={job.recruitmentManagerName} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-blue-800">{job.recruitmentManagerName}</p>
                        <p className="text-[10px] text-blue-600">Recruitment Manager</p>
                      </div>
                    </div>
                  )}
                  {(job.assignedToNames || []).map((name, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                      <Avatar name={name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{name}</p>
                        <p className="text-[10px] text-gray-500">Assignee</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional details */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
              {[
                { label: "Client",      value: job.clientName,    icon: Building2 },
                { label: "Vendor",      value: job.vendorName,    icon: Truck     },
                { label: "Salary",      value: job.salary ? `$${job.salary.min.toLocaleString()} – $${job.salary.max.toLocaleString()}` : undefined, icon: DollarSign },
                { label: "Created",     value: new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), icon: Calendar },
                { label: "Posted by",   value: job.postedByName,  icon: UserCheck },
                { label: "Client notes",value: job.clientNotes,   icon: FileText  },
              ].filter((d) => d.value).map((d) => (
                <div key={d.label} className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                    <d.icon className="w-3.5 h-3.5" />{d.label}
                  </div>
                  <p className="text-sm text-gray-700">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Applicants tab ── */}
        {activeTab === "applicants" && (
          <div>
            {/* Pipeline summary strip */}
            {applications.length > 0 && (
              <div className="px-4 pt-4 pb-2">
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: "all", label: "All", count: applications.length },
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
                      <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-bold", statusFilter === s.key ? "bg-white/20 text-white" : "bg-white text-gray-600")}>
                        {s.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search + controls */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applicants…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                onClick={() => { setEditingApp(null); setDrawerOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" />Add
              </button>
            </div>

            {/* Applicant rows */}
            {filteredApps.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-base font-semibold text-gray-600 mb-1">No applicants yet</p>
                <p className="text-sm text-gray-400 mb-5">
                  {applications.length === 0 ? "Be the first to add an applicant for this role." : "No applicants match your filter."}
                </p>
                {applications.length === 0 && (
                  <button onClick={() => { setEditingApp(null); setDrawerOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
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

            {/* Count */}
            {filteredApps.length > 0 && (
              <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                {filteredApps.length} of {applications.length} applicants
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit applicant drawer ── */}
      <CandidateEditDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={editingApp ? "edit" : "create"}
        candidate={editingApp}
        jobs={job ? [job] : []}
        defaultJobId={jobId}
        onSaved={(saved) => {
          setApplications((prev) =>
            editingApp
              ? prev.map((a) => (a.id === saved.id ? saved : a))
              : [saved, ...prev],
          );
          setActiveTab("applicants");
        }}
      />
    </div>
  );
}

// ── Applicant row ─────────────────────────────────────────────────────────────

function ApplicantRow({
  app, jobId, onStatusChange, onEdit,
}: {
  app: Application;
  jobId: string;
  onStatusChange: (id: string, status: Application["status"]) => void;
  onEdit: (app: Application) => void;
}) {
  const [open, setOpen] = useState(false);
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
    <div className="px-4 py-3.5 hover:bg-gray-50/60 transition-colors group">
      <div className="flex items-center gap-3">
        {/* Avatar + name */}
        <button
          onClick={() => router.push(`/admin/candidates/${app.id}`)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <Avatar name={app.name || app.email} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
              {app.name || "Unnamed"}
            </p>
            <p className="text-xs text-gray-500 truncate">{app.email}</p>
          </div>
        </button>

        {/* Source & location */}
        <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
          {app.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.city}{app.state ? `, ${app.state}` : ""}</span>}
          {app.source && <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{app.source}</span>}
        </div>

        {/* Skills chips */}
        {app.skills && app.skills.length > 0 && (
          <div className="hidden lg:flex items-center gap-1">
            {app.skills.slice(0, 3).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full border border-blue-100">{s}</span>
            ))}
            {app.skills.length > 3 && <span className="text-[10px] text-gray-400">+{app.skills.length - 3}</span>}
          </div>
        )}

        {/* Status select */}
        <div className="relative flex-shrink-0">
          <StatusBadge status={app.status} />
        </div>

        {/* Date */}
        <span className="hidden sm:block text-xs text-gray-400 flex-shrink-0">
          {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onStatusChange(app.id, s.value); setOpen(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors",
                      app.status === s.value ? "font-semibold text-blue-600 bg-blue-50" : "text-gray-700",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onEdit(app)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
