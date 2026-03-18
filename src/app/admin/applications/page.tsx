"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Mail,
  Phone,
  Calendar,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Star,
  Briefcase,
  Loader2,
  LayoutGrid,
  LayoutList,
  User,
  X,
  Trash2,
  Plus,
  Edit3,
  MapPin,
  Users,
  History,
  Copy,
  ArrowLeft,
  Upload,
  File,
  AlertCircle,
  ChevronDown,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface ApplicationWithJob extends Application {
  jobDepartment?: string;
  postedByName?: string;
  postedByEmail?: string;
  postedByRole?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    badgeBg: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  reviewing: {
    label: "Reviewing",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
    badgeBg: "bg-blue-100 text-blue-800",
    icon: Eye,
  },
  interview: {
    label: "Interview",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
    badgeBg: "bg-purple-100 text-purple-800",
    icon: MessageSquare,
  },
  offered: {
    label: "Offered",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dotColor: "bg-cyan-500",
    badgeBg: "bg-cyan-100 text-cyan-800",
    icon: Mail,
  },
  hired: {
    label: "Hired",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
    badgeBg: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    dotColor: "bg-rose-500",
    badgeBg: "bg-rose-100 text-rose-800",
    icon: XCircle,
  },
  active: {
    label: "Active",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
    badgeBg: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  inactive: {
    label: "Inactive",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    dotColor: "bg-gray-400",
    badgeBg: "bg-gray-100 text-gray-700",
    icon: XCircle,
  },
};

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

type ViewMode = "table" | "cards";
type DateRange = "all" | "today" | "week" | "month" | "custom";
type PageMode = "list" | "create" | "edit" | "view";

interface CognitoUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "reviewing", label: "Reviewing" },
  { key: "interview", label: "Interview" },
  { key: "offered", label: "Offered" },
  { key: "hired", label: "Hired" },
  { key: "rejected", label: "Rejected" },
] as const;

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badgeBg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
      {initials}
    </div>
  );
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hrUsers, setHrUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [recruiterFilter, setRecruiterFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [uploadingResume, setUploadingResume] = useState<string | null>(null);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [formResumeUploading, setFormResumeUploading] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>("list");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [detailTab, setDetailTab] = useState<"overview" | "skills" | "notes" | "history">("overview");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    source: "" as Application["source"] | "",
    status: "pending" as Application["status"],
    jobId: "",
    jobTitle: "",
    ownership: "",
    ownershipName: "",
    workAuthorization: "" as Application["workAuthorization"] | "",
    rating: 0,
    notes: "",
    addToTalentBench: false,
    skills: [] as string[],
    experience: "",
    coverLetter: "",
  });

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsResponse, jobsResponse] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/jobs"),
      ]);
      const appsData = await appsResponse.json();
      const jobsData = await jobsResponse.json();
      if (!appsResponse.ok || !jobsResponse.ok) throw new Error("Failed to fetch data");

      setJobs(jobsData.jobs || []);
      const jobsMap = new Map<string, Job>((jobsData.jobs || []).map((job: Job) => [job.id, job]));
      const appsWithJobs = (appsData.applications || []).map((app: Application) => {
        const job = app.jobId ? jobsMap.get(app.jobId) : null;
        return {
          ...app,
          jobTitle: app.jobTitle || job?.title || "",
          jobDepartment: job?.department || "",
          postedByName: job?.postedByName,
          postedByEmail: job?.postedByEmail,
          postedByRole: job?.postedByRole,
        };
      });
      appsWithJobs.sort((a: ApplicationWithJob, b: ApplicationWithJob) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      );
      setApplications(appsWithJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        const users = data.users || [];
        setHrUsers(users.filter((u: CognitoUser) => u.role === "hr" || u.role === "admin"));
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const positions = [...new Set(applications.map((a) => a.jobTitle).filter(Boolean))];
  const recruiters = [...new Set(applications.map((a) => a.postedByName || a.ownershipName).filter(Boolean))] as string[];
  const sources = [...new Set(applications.map((a) => a.source).filter(Boolean))] as string[];

  const isWithinDateRange = (dateStr: string) => {
    if (dateRange === "all") return true;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateRange === "today") {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }
    if (dateRange === "week") {
      const ago = new Date(today); ago.setDate(ago.getDate() - 7);
      return date >= ago;
    }
    if (dateRange === "month") {
      const ago = new Date(today); ago.setMonth(ago.getMonth() - 1);
      return date >= ago;
    }
    if (dateRange === "custom") {
      const from = customDateFrom ? new Date(customDateFrom) : null;
      const to = customDateTo ? new Date(customDateTo) : null;
      if (from && to) return date >= from && date <= new Date(to.getTime() + 86400000);
      if (from) return date >= from;
      if (to) return date <= new Date(to.getTime() + 86400000);
    }
    return true;
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      (app.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.applicationId?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (app.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (app.phone?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesPosition = positionFilter === "all" || app.jobTitle === positionFilter;
    const matchesRecruiter = recruiterFilter === "all" || app.postedByName === recruiterFilter || app.ownershipName === recruiterFilter;
    const matchesSource = sourceFilter === "all" || app.source === sourceFilter;
    const matchesDate = isWithinDateRange(app.appliedAt);
    return matchesSearch && matchesStatus && matchesPosition && matchesRecruiter && matchesSource && matchesDate;
  });

  const statusCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "all"
      ? applications.length
      : applications.filter(a => a.status === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  const handleStatusChange = async (appId: string, newStatus: Application["status"]) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changedBy: user?.id, changedByName: user?.name || user?.email || "Admin" }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      await fetchData();
    } catch (err) {
      alert("Failed to update application status");
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatusValue || selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id =>
        fetch(`/api/applications/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkStatusValue, changedBy: user?.id, changedByName: user?.name || "Admin" }),
        })
      ));
      await fetchData();
      setSelectedIds([]);
      setBulkStatusValue("");
    } catch {
      alert("Failed to update statuses");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected application(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedIds.map(id =>
        fetch(`/api/applications/${id}`, { method: "DELETE" })
      ));
      setApplications(prev => prev.filter(a => !selectedIds.includes(a.id)));
      setSelectedIds([]);
    } catch {
      alert("Failed to delete applications");
    }
  };

  const handleRatingChange = async (appId: string, rating: number) => {
    const prevApplications = applications;
    const prevSelected = selectedApplication;
    // Optimistic update — UI reflects immediately
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, rating } : a));
    setSelectedApplication(prev => prev && prev.id === appId ? { ...prev, rating } : prev);
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) throw new Error("Failed to update rating");
    } catch {
      // Revert on failure
      setApplications(prevApplications);
      setSelectedApplication(prevSelected);
      alert("Failed to update rating");
    }
  };

  const handleNotesSave = async (appId: string) => {
    const saved = noteText;
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, notes: saved } : a));
    setSelectedApplication(prev => prev && prev.id === appId ? { ...prev, notes: saved } : prev);
    setEditingNoteId(null);
    setNoteText("");
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: saved }),
      });
      if (!response.ok) throw new Error("Failed to save notes");
    } catch {
      alert("Failed to save notes");
    }
  };

  const handleExportCSV = () => {
    const headers = ["App ID","Name","Email","Phone","Position","Job ID","Status","Source","Work Authorization","Applied Date","Rating","City","State","Skills","Notes","Assigned To","Talent Bench"];
    const rows = filteredApplications.map((app) => [
      `"${app.applicationId || app.id.slice(0, 8)}"`,
      `"${app.name || "Unknown"}"`,
      `"${app.email}"`,
      `"${app.phone || ""}"`,
      `"${app.jobTitle || ""}"`,
      `"${app.jobId || ""}"`,
      `"${app.status}"`,
      `"${app.source || "Career Portal"}"`,
      `"${app.workAuthorization || ""}"`,
      `"${new Date(app.appliedAt).toLocaleDateString()}"`,
      `"${app.rating?.toString() || ""}"`,
      `"${app.city || ""}"`,
      `"${app.state || ""}"`,
      `"${app.skills?.join(", ") || ""}"`,
      `"${(app.notes || "").replace(/"/g, '""')}"`,
      `"${app.ownershipName || app.postedByName || ""}"`,
      `"${app.addToTalentBench ? "Yes" : "No"}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to get resume");
      window.open(data.downloadUrl, "_blank");
    } catch {
      alert("Failed to load resume. The file may have been deleted.");
    }
  };

  const handleResumeUpload = async (appId: string, file: File) => {
    setUploadingResume(appId);
    setResumeUploadError(null);
    try {
      const uploadRes = await fetch("/api/resume/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: appId, fileName: file.name, fileType: file.type, fileSize: file.size }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to get upload URL");
      const { uploadUrl, resumeId } = uploadData;
      const s3Res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!s3Res.ok) throw new Error("Failed to upload file to storage");
      const updateRes = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, resumeFileName: file.name }),
      });
      if (!updateRes.ok) throw new Error("Failed to link resume to application");
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, resumeId, resumeFileName: file.name } : app));
      if (selectedApplication?.id === appId) {
        setSelectedApplication(prev => prev ? { ...prev, resumeId, resumeFileName: file.name } : prev);
      }
    } catch (err) {
      setResumeUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingResume(null);
    }
  };

  const handleDeleteApplication = async (appId: string, appName: string) => {
    if (!confirm(`Delete application from ${appName}? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/applications/${appId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete application");
      setApplications(prev => prev.filter(app => app.id !== appId));
    } catch {
      alert("Failed to delete application");
    }
  };

  const handleDuplicateApplication = async (app: ApplicationWithJob) => {
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: app.firstName || app.name?.split(" ")[0] || "",
          lastName: app.lastName || app.name?.split(" ").slice(1).join(" ") || "",
          phone: app.phone || "",
          email: app.email,
          address: app.address,
          city: app.city,
          state: app.state,
          zipCode: app.zipCode,
          source: app.source,
          status: "pending",
          jobId: app.jobId,
          jobTitle: app.jobTitle,
          ownership: app.ownership,
          ownershipName: app.ownershipName,
          workAuthorization: app.workAuthorization,
          rating: 0,
          notes: "",
          addToTalentBench: app.addToTalentBench,
          skills: app.skills,
          experience: app.experience,
          createdBy: user?.id,
          createdByName: user?.name,
        }),
      });
      if (!response.ok) throw new Error("Failed to duplicate application");
      await fetchData();
      alert("Application duplicated successfully");
    } catch {
      alert("Failed to duplicate application");
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "", lastName: "", phone: "", email: "", address: "", city: "",
      state: "", zipCode: "", source: "", status: "pending", jobId: "", jobTitle: "",
      ownership: "", ownershipName: "", workAuthorization: "", rating: 0, notes: "",
      addToTalentBench: false, skills: [], experience: "", coverLetter: "",
    });
    setHoverRating(0);
    setPendingResumeFile(null);
  };

  const handleCreateNew = () => { resetForm(); setSelectedApplication(null); setPageMode("create"); };

  const handleEditApplication = (app: ApplicationWithJob) => {
    setSelectedApplication(app);
    setFormData({
      firstName: app.firstName || app.name?.split(" ")[0] || "",
      lastName: app.lastName || app.name?.split(" ").slice(1).join(" ") || "",
      phone: app.phone || "", email: app.email,
      address: app.address || "", city: app.city || "", state: app.state || "", zipCode: app.zipCode || "",
      source: app.source || "", status: app.status, jobId: app.jobId || "", jobTitle: app.jobTitle || "",
      ownership: app.ownership || "", ownershipName: app.ownershipName || "",
      workAuthorization: app.workAuthorization || "", rating: app.rating || 0, notes: app.notes || "",
      addToTalentBench: app.addToTalentBench || false, skills: app.skills || [],
      experience: app.experience || "", coverLetter: app.coverLetter || "",
    });
    setPageMode("edit");
  };

  const handleViewApplication = (app: ApplicationWithJob) => {
    setSelectedApplication(app);
    setPageMode("view");
  };

  const handleJobSelect = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    setFormData({ ...formData, jobId, jobTitle: job?.title || "" });
  };

  const handleOwnershipSelect = (userId: string) => {
    const selectedUser = hrUsers.find((u) => u.id === userId);
    setFormData({ ...formData, ownership: userId, ownershipName: selectedUser?.name || selectedUser?.email || "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error("Please fill in all required fields (First Name, Last Name, Email)");
      }
      let resumeId: string | undefined;
      let resumeFileName: string | undefined;
      if (pendingResumeFile) {
        setFormResumeUploading(true);
        try {
          const uploadRes = await fetch("/api/resume/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: formData.email, fileName: pendingResumeFile.name, fileType: pendingResumeFile.type, fileSize: pendingResumeFile.size }),
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to get upload URL");
          resumeId = uploadData.resumeId;
          resumeFileName = pendingResumeFile.name;
          const s3Res = await fetch(uploadData.uploadUrl, { method: "PUT", body: pendingResumeFile, headers: { "Content-Type": pendingResumeFile.type } });
          if (!s3Res.ok) throw new Error("Failed to upload resume to storage");
        } finally {
          setFormResumeUploading(false);
        }
      }
      const applicationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || undefined,
        email: formData.email,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        source: formData.source || "Other",
        status: formData.status,
        jobId: formData.jobId || undefined,
        jobTitle: formData.jobTitle || undefined,
        ownership: formData.ownership || undefined,
        ownershipName: formData.ownershipName || undefined,
        workAuthorization: formData.workAuthorization || undefined,
        rating: formData.rating,
        notes: formData.notes || undefined,
        addToTalentBench: formData.addToTalentBench,
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        experience: formData.experience || undefined,
        coverLetter: formData.coverLetter || undefined,
        createdBy: user?.id || "system",
        createdByName: user?.name || user?.email?.split("@")[0] || "System",
        ...(resumeId && { resumeId, resumeFileName }),
      };
      let response;
      if (pageMode === "edit" && selectedApplication) {
        response = await fetch(`/api/applications/${selectedApplication.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(applicationData),
        });
      } else {
        response = await fetch("/api/applications", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(applicationData),
        });
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save application");
      }
      await fetchData();
      setPageMode("list");
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save application");
    } finally {
      setSubmitting(false);
      setFormResumeUploading(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return formatDate(dateStr);
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedIds(prev => prev.length === filteredApplications.length ? [] : filteredApplications.map(a => a.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-500 text-sm">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-rose-600 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Retry</button>
        </div>
      </div>
    );
  }

  // ─── Create / Edit Form ───────────────────────────────────────────────────
  if (pageMode === "create" || pageMode === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => { setPageMode("list"); resetForm(); }} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageMode === "create" ? "New Application" : "Edit Application"}</h1>
            <p className="text-gray-500 text-sm">{pageMode === "create" ? "Create a new candidate application" : `Editing: ${selectedApplication?.name}`}</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <User className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name <span className="text-rose-500">*</span></Label>
                  <Input id="firstName" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="John" className="border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name <span className="text-rose-500">*</span></Label>
                  <Input id="lastName" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Doe" className="border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input id="email" required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" className="pl-9 border-gray-200" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 123-4567" className="pl-9 border-gray-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <MapPin className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Address</h3>
              </div>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main Street" className="border-gray-200" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" className="border-gray-200" />
                <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
                  <SelectTrigger className="border-gray-200"><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} placeholder="ZIP Code" className="border-gray-200" />
              </div>
            </div>

            {/* Application Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Application Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Source</Label>
                  <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v as Application["source"] })}>
                    <SelectTrigger className="border-gray-200"><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {["LinkedIn","Indeed","Company Website","Career Portal","Referral","Agency","Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Application["status"] })}>
                    <SelectTrigger className="border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending","reviewing","interview","offered","hired","rejected","active","inactive"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Job Position</Label>
                  <Select value={formData.jobId} onValueChange={handleJobSelect}>
                    <SelectTrigger className="border-gray-200"><SelectValue placeholder="Select a job (optional)" /></SelectTrigger>
                    <SelectContent>{jobs.map(job => <SelectItem key={job.id} value={job.id}>{job.postingId ? `${job.postingId} - ` : ""}{job.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Job Title</Label>
                  <Input value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="Auto-populated or enter manually" className="border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Assigned To</Label>
                  <Select value={formData.ownership} onValueChange={handleOwnershipSelect}>
                    <SelectTrigger className="border-gray-200"><SelectValue placeholder="Assign to team member" /></SelectTrigger>
                    <SelectContent>{hrUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Work Authorization</Label>
                  <Select value={formData.workAuthorization} onValueChange={(v) => setFormData({ ...formData, workAuthorization: v as Application["workAuthorization"] })}>
                    <SelectTrigger className="border-gray-200"><SelectValue placeholder="Select authorization" /></SelectTrigger>
                    <SelectContent>
                      {["US Citizen","Green Card","H1-B","OPT/CPT","TN Visa","Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Rating & Notes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Star className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Rating & Notes</h3>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Rating</Label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="focus:outline-none">
                      <Star className={`w-7 h-7 transition-colors ${star <= (hoverRating || formData.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-300"}`} />
                    </button>
                  ))}
                  {formData.rating > 0 && <button type="button" onClick={() => setFormData({ ...formData, rating: 0 })} className="ml-2 text-xs text-gray-400 hover:text-gray-600">Clear</button>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Notes</Label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full min-h-[100px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" placeholder="Add notes about this candidate..." />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="talentBench" checked={formData.addToTalentBench} onCheckedChange={(c) => setFormData({ ...formData, addToTalentBench: c as boolean })} />
                <Label htmlFor="talentBench" className="text-sm font-normal cursor-pointer text-gray-600">Add to talent bench for future opportunities</Label>
              </div>
            </div>

            {/* Resume */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <File className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Resume</h3>
              </div>
              {pageMode === "edit" && selectedApplication?.resumeId && !pendingResumeFile && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-800">Resume attached</p>
                    {selectedApplication.resumeFileName && <p className="text-xs text-blue-600 truncate">{selectedApplication.resumeFileName}</p>}
                  </div>
                  <button type="button" onClick={() => handleViewResume(selectedApplication.resumeId!)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">View</button>
                </div>
              )}
              {pendingResumeFile ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <File className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-800 truncate">{pendingResumeFile.name}</p>
                    <p className="text-xs text-emerald-600">{(pendingResumeFile.size / 1024).toFixed(0)} KB — will upload on save</p>
                  </div>
                  <button type="button" onClick={() => setPendingResumeFile(null)} className="p-1 text-emerald-600 hover:text-emerald-800 rounded"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 w-full p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors group">
                  <Upload className="h-8 w-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{pageMode === "edit" && selectedApplication?.resumeId ? "Click to replace resume" : "Click to attach resume"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX — max 5 MB</p>
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPendingResumeFile(f); e.target.value = ""; }} />
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => { setPageMode("list"); resetForm(); }} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting || formResumeUploading} className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                {(submitting || formResumeUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                {formResumeUploading ? "Uploading..." : submitting ? "Saving..." : pageMode === "create" ? "Create Application" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── View Application ─────────────────────────────────────────────────────
  if (pageMode === "view" && selectedApplication) {
    const app = selectedApplication;
    const progressStages = [
      { id: "pending", label: "Pending" },
      { id: "reviewing", label: "Reviewing" },
      { id: "interview", label: "Interview" },
      { id: "offered", label: "Offered" },
      { id: "hired", label: "Hired" },
    ];
    const isRejected = app.status === "rejected";
    const currentStageIdx = progressStages.findIndex(s => s.id === app.status);
    const initials = (app.name || "NA").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
      <div className="min-h-screen bg-gray-50/50  p-6 overflow-x-hidden">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setPageMode("list"); setSelectedApplication(null); }} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Applications
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => handleEditApplication(app)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 bg-white transition-colors">
              <Edit3 className="h-4 w-4" /> Edit
            </button>
            <button onClick={() => handleDuplicateApplication(app)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 bg-white transition-colors">
              <Copy className="h-4 w-4" /> Duplicate
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
          {/* Top strip — subtle tinted, no gradient */}
          <div className="bg-gray-50 border-b border-gray-100 px-4 sm:px-8 py-6 overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-xl font-bold text-blue-700 flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{app.name}</h1>
                  <StatusBadge status={app.status} />
                  {app.rating ? (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{app.rating}/5
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{app.jobTitle || "General Application"}</p>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 flex-wrap">
                  <span>ID: {(app.applicationId || app.id.slice(-8)).toUpperCase()}</span>
                  {app.jobDepartment && <span>· {app.jobDepartment}</span>}
                  <span>· Applied {formatDate(app.appliedAt)}</span>
                </div>
              </div>
            </div>

            {/* Pipeline Stepper */}
            <div className="mt-5 flex flex-wrap items-center gap-y-2">
              {progressStages.map((stage, idx) => {
                const isActive = app.status === stage.id;
                const isPast = !isRejected && currentStageIdx > idx;
                const cfg = statusConfig[stage.id as keyof typeof statusConfig] || statusConfig.pending;
                return (
                  <div key={stage.id} className="flex items-center">
                    <button
                      onClick={() => { handleStatusChange(app.id, stage.id as Application["status"]); setSelectedApplication({ ...app, status: stage.id as Application["status"] }); }}
                      className={`flex flex-col items-center gap-1 py-1.5 px-2.5 rounded-xl transition-all ${isActive ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-100 border border-transparent"}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isActive ? `${cfg.dotColor} border-transparent text-white` : isPast ? "bg-gray-200 border-gray-200 text-gray-500" : "bg-white border-gray-200 text-gray-400"}`}>
                        {isPast ? <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" /> : idx + 1}
                      </div>
                      <span className={`text-[10px] font-semibold ${isActive ? "text-blue-700" : isPast ? "text-gray-500" : "text-gray-400"}`}>{stage.label}</span>
                    </button>
                    {idx < progressStages.length - 1 && (
                      <div className={`h-0.5 w-4 flex-shrink-0 ${isPast || isActive ? "bg-gray-300" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
              {/* Rejected off-track */}
              <div className="flex items-center gap-1 ml-2">
                <div className={`h-0.5 w-3 ${isRejected ? "bg-rose-300" : "bg-gray-200"}`} />
                <button
                  onClick={() => { handleStatusChange(app.id, "rejected"); setSelectedApplication({ ...app, status: "rejected" as Application["status"] }); }}
                  className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all border ${isRejected ? "bg-rose-50 border-rose-200" : "hover:bg-gray-100 border-transparent"}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isRejected ? "bg-rose-500 border-rose-500 text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-semibold ${isRejected ? "text-rose-600" : "text-gray-400"}`}>Rejected</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width tabbed panel */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full min-w-0">
          {/* Tab Bar */}
          <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-gray-100">
            {(["overview", "skills", "notes", "history"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors capitalize ${detailTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {detailTab === "overview" && (
              <div className="space-y-6">
                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Contact */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Contact</h3>
                    <div className="space-y-2">
                      <a href={`mailto:${app.email}`} className="flex items-start gap-2 min-w-0 text-sm text-gray-700 hover:text-blue-600 transition-colors group">
                        <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="break-all min-w-0 leading-tight">{app.email}</span>
                      </a>
                      {app.phone && (
                        <a href={`tel:${app.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors group">
                          <Phone className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />{app.phone}
                        </a>
                      )}
                      {(app.address || app.city || app.state) && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight break-words">{[app.address, app.city, app.state, app.zipCode].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Position */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Position</h3>
                    <div className="space-y-2">
                      {app.jobTitle && <div className="flex items-center gap-2 text-sm text-gray-700"><Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="break-words">{app.jobTitle}</span></div>}
                      {app.source && <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-4 h-4 flex-shrink-0 inline-flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /></span>via {app.source}</div>}
                      {app.workAuthorization && <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />{app.workAuthorization}</div>}
                      {(app.ownershipName || app.postedByName) && (
                        <div className="flex items-start gap-2 text-sm text-gray-600 min-w-0">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="break-all min-w-0">{app.ownershipName || app.postedByName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">App ID</p><p className="font-mono text-xs text-gray-700">{(app.applicationId || app.id.slice(-8)).toUpperCase()}</p></div>
                      <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Applied</p><p className="text-gray-700">{formatDate(app.appliedAt)}</p></div>
                      {app.updatedAt && <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Updated</p><p className="text-gray-700">{formatDate(app.updatedAt)}</p></div>}
                      <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Talent Bench</p><p className="text-gray-700">{app.addToTalentBench ? "Yes" : "No"}</p></div>
                    </div>
                  </div>
                </div>

                {/* Rating + Resume + Actions row */}
                <div className="flex flex-wrap items-center gap-4 px-1">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</span>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} onClick={() => handleRatingChange(app.id, star)} className="p-0.5 transition-transform hover:scale-110 focus:outline-none">
                          <Star className={`w-5 h-5 transition-colors ${star <= (app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-300"}`} />
                        </button>
                      ))}
                      {(app.rating || 0) > 0 && (
                        <button onClick={() => handleRatingChange(app.id, 0)} className="ml-1 text-xs text-gray-400 hover:text-gray-600">Clear</button>
                      )}
                    </div>
                  </div>

                  <div className="h-5 w-px bg-gray-200" />

                  {/* Resume */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resume</span>
                    {app.resumeId && (
                      <button onClick={() => handleViewResume(app.resumeId!)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs font-medium transition-colors border border-blue-100">
                        <FileText className="w-3.5 h-3.5" /> View Resume
                      </button>
                    )}
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${uploadingResume === app.id ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400" : "border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600"}`}>
                      {uploadingResume === app.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : <><Upload className="w-3.5 h-3.5" />{app.resumeId ? "Replace" : "Upload"}</>}
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={uploadingResume === app.id} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleResumeUpload(app.id, f); e.target.value = ""; }} />
                    </label>
                    {resumeUploadError && uploadingResume === null && (
                      <p className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{resumeUploadError}</p>
                    )}
                  </div>

                  <div className="h-5 w-px bg-gray-200" />

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={`mailto:${app.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium">
                      <Mail className="w-3.5 h-3.5" /> Send Email
                    </a>
                    {app.phone && (
                      <a href={`tel:${app.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700">
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                    <button onClick={() => handleDeleteApplication(app.id, app.name || "applicant")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors border border-transparent hover:border-rose-100">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>

                {/* Experience & Cover Letter */}
                {(app.experience || app.coverLetter) ? (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    {app.experience && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Experience</h3>
                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap">{app.experience}</div>
                      </div>
                    )}
                    {app.coverLetter && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cover Letter</h3>
                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap">{app.coverLetter}</div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

              {/* Skills Tab */}
              {detailTab === "skills" && (
                <div>
                  {app.skills && app.skills.length > 0 ? (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Skills & Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {app.skills.map(s => (
                          <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100 hover:bg-blue-100 transition-colors">{s}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Star className="w-10 h-10 text-gray-200 mb-3" />
                      <p className="text-sm text-gray-400">No skills listed</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {detailTab === "notes" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Internal Notes</h3>
                  {editingNoteId === app.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none min-h-[160px]"
                        placeholder="Add internal notes about this applicant..."
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleNotesSave(app.id)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">Save Note</button>
                        <button onClick={() => { setEditingNoteId(null); setNoteText(""); }} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {app.notes ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{app.notes}</div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-xl mb-3">
                          <History className="w-8 h-8 text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400">No notes yet</p>
                        </div>
                      )}
                      <button
                        onClick={() => { setEditingNoteId(app.id); setNoteText(app.notes || ""); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />{app.notes ? "Edit Note" : "Add Note"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {detailTab === "history" && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Status Timeline</h3>
                  {app.statusHistory && app.statusHistory.length > 0 ? (
                    <div className="space-y-0">
                      {[...app.statusHistory].reverse().map((entry, idx) => {
                        const cfg = statusConfig[entry.status as keyof typeof statusConfig] || statusConfig.pending;
                        const isLast = idx === app.statusHistory!.length - 1;
                        return (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 border-2 border-white shadow ${cfg.dotColor}`} />
                              {!isLast && <div className="w-0.5 bg-gray-200 flex-1 my-1" />}
                            </div>
                            <div className="pb-5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <StatusBadge status={entry.status} />
                                <span className="text-xs text-gray-400">{formatDate(entry.changedAt)}</span>
                              </div>
                              {entry.changedByName && <p className="text-xs text-gray-500 mt-1">{entry.changedByName}</p>}
                              {entry.notes && <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{entry.notes}&rdquo;</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Clock className="w-10 h-10 text-gray-200 mb-3" />
                      <p className="text-sm text-gray-400">No status history yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    );
  }

  // ─── List View ─────────────────────────────────────────────────────────────
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    reviewing: applications.filter(a => a.status === "reviewing").length,
    interview: applications.filter(a => a.status === "interview").length,
    hired: applications.filter(a => a.status === "hired").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">{applications.length}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Manage all candidate applications</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} disabled={filteredApplications.length === 0} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={handleCreateNew} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Application</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900", bg: "bg-gray-50" },
          { label: "Pending", value: stats.pending, color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Reviewing", value: stats.reviewing, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Interview", value: stats.interview, color: "text-purple-700", bg: "bg-purple-50" },
          { label: "Hired", value: stats.hired, color: "text-emerald-700", bg: "bg-emerald-50" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-200`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="p-4 space-y-3">
          {/* Search + controls */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search candidates, positions, emails..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-700">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-all ${showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              <Filter className="w-4 h-4" /> Filters
              {(positionFilter !== "all" || recruiterFilter !== "all" || sourceFilter !== "all") && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-medium">{[positionFilter !== "all", recruiterFilter !== "all", sourceFilter !== "all"].filter(Boolean).length}</span>
              )}
            </button>
            {/* View toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("table")} className={`p-2 transition-colors ${viewMode === "table" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`} title="Table view"><LayoutList className="w-4 h-4" /></button>
              <button onClick={() => setViewMode("cards")} className={`p-2 transition-colors border-l border-gray-200 ${viewMode === "cards" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`} title="Card view"><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Date range */}
          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customDateFrom} onChange={e => setCustomDateFrom(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={customDateTo} onChange={e => setCustomDateTo(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          )}

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map(tab => (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === tab.key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>{statusCounts[tab.key] || 0}</span>
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-3">
              <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="all">All Positions</option>
                {positions.map(p => <option key={p} value={p!}>{p}</option>)}
              </select>
              <select value={recruiterFilter} onChange={e => setRecruiterFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="all">All Recruiters</option>
                {recruiters.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="all">All Sources</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {(positionFilter !== "all" || recruiterFilter !== "all" || sourceFilter !== "all") && (
                <button onClick={() => { setPositionFilter("all"); setRecruiterFilter("all"); setSourceFilter("all"); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Clear filters</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-sm font-medium text-blue-800">{selectedIds.length} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <select value={bulkStatusValue} onChange={e => setBulkStatusValue(e.target.value)} className="px-3 py-1.5 text-xs border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700">
              <option value="">Change status to...</option>
              {["pending","reviewing","interview","offered","hired","rejected"].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            <button onClick={handleBulkStatusChange} disabled={!bulkStatusValue} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Apply</button>
            <button onClick={handleBulkDelete} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
            <button onClick={() => setSelectedIds([])} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-gray-400">{filteredApplications.length} of {applications.length} applications</p>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left">
                    <input type="checkbox" checked={selectedIds.length === filteredApplications.length && filteredApplications.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Candidate</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Position</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Source</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Rating</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Applied</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.length > 0 ? filteredApplications.map(app => (
                  <tr key={app.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(app.id) ? "bg-blue-50/50" : ""}`}>
                    <td className="py-3.5 px-4">
                      <input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggleSelect(app.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={app.name || app.email} />
                        <div className="min-w-0">
                          <button onClick={() => handleViewApplication(app)} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left truncate block">
                            {app.name || "Unnamed"}
                          </button>
                          <p className="text-xs text-gray-400 truncate">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div>
                        <p className="text-sm text-gray-900">{app.jobTitle || "—"}</p>
                        {app.jobDepartment && <p className="text-xs text-gray-400">{app.jobDepartment}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 hidden lg:table-cell">
                      {app.source && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{app.source}</span>}
                    </td>
                    <td className="py-3.5 px-4"><StatusBadge status={app.status} /></td>
                    <td className="py-3.5 px-4 hidden xl:table-cell">
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= (app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">{formatTimeAgo(app.appliedAt)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewApplication(app)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleEditApplication(app)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteApplication(app.id, app.name || "candidate")} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <h3 className="text-base font-semibold text-gray-900 mb-1">No applications found</h3>
                      <p className="text-sm text-gray-400 mb-4">{applications.length === 0 ? "No applications yet" : "No applications match your filters"}</p>
                      {applications.length === 0 && (
                        <button onClick={handleCreateNew} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Add First Application</button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredApplications.length > 0 ? filteredApplications.map(app => (
            <div key={app.id} className={`border border-gray-200 rounded-xl bg-white shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer ${selectedIds.includes(app.id) ? "ring-2 ring-blue-500 border-blue-200" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggleSelect(app.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0" />
                  <Avatar name={app.name || app.email} />
                  <div className="min-w-0">
                    <button onClick={() => handleViewApplication(app)} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left truncate block">{app.name || "Unnamed"}</button>
                    <p className="text-xs text-gray-400 truncate">{app.email}</p>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
              {app.jobTitle && <p className="text-xs text-gray-600 mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3 text-gray-400" /> {app.jobTitle}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= (app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">{formatTimeAgo(app.appliedAt)}</span>
                  <button onClick={() => handleEditApplication(app)} className="p-1 text-gray-400 hover:text-gray-700 rounded"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteApplication(app.id, app.name || "candidate")} className="p-1 text-gray-400 hover:text-rose-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-16 text-center border border-gray-200 rounded-xl bg-white">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No applications found</h3>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
