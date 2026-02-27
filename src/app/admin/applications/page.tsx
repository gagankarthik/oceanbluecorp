"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
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
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  Briefcase,
  Loader2,
  LayoutGrid,
  LayoutList,
  StickyNote,
  User,
  X,
  Trash2,
  Plus,
  Edit3,
  MapPin,
  Shield,
  Users,
  History,
  Copy,
  ArrowLeft,
  Upload,
  File,
  AlertCircle,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
    label: "Pending Review",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    icon: Clock,
  },
  reviewing: {
    label: "Under Review",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
    icon: Eye,
  },
  interview: {
    label: "Interview",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
    icon: MessageSquare,
  },
  offered: {
    label: "Offer Sent",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dotColor: "bg-cyan-500",
    icon: Mail,
  },
  hired: {
    label: "Hired",
    color: "bg-green-50 text-green-700 border-green-200",
    dotColor: "bg-green-500",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-200",
    dotColor: "bg-red-500",
    icon: XCircle,
  },
  active: {
    label: "Active",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
    icon: CheckCircle2,
  },
  inactive: {
    label: "Inactive",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    dotColor: "bg-gray-500",
    icon: XCircle,
  },
};

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showTimeline, setShowTimeline] = useState<string | null>(null);

  // Form states
  const [pageMode, setPageMode] = useState<PageMode>("list");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

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

  // Fetch data
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

      if (!appsResponse.ok || !jobsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      setJobs(jobsData.jobs || []);

      // Merge job info with applications
      const jobsMap = new Map<string, Job>(
        (jobsData.jobs || []).map((job: Job) => [job.id, job])
      );

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

      // Sort by appliedAt descending
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

  // Date filtering logic
  const isWithinDateRange = (dateStr: string) => {
    if (dateRange === "all") return true;

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRange === "today") {
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      return dateOnly.getTime() === today.getTime();
    }

    if (dateRange === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }

    if (dateRange === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    }

    if (dateRange === "custom") {
      const from = customDateFrom ? new Date(customDateFrom) : null;
      const to = customDateTo ? new Date(customDateTo) : null;
      if (from && to) {
        return date >= from && date <= new Date(to.getTime() + 86400000);
      }
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

  const handleStatusChange = async (appId: string, newStatus: Application["status"]) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          changedBy: user?.id,
          changedByName: user?.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refetch to get updated status history
      await fetchData();
    } catch (err) {
      alert("Failed to update application status");
    }
  };

  const handleRatingChange = async (appId: string, rating: number) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error("Failed to update rating");
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, rating } : app))
      );
    } catch (err) {
      alert("Failed to update rating");
    }
  };

  const handleNotesSave = async (appId: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, notes: noteText } : app
        )
      );
      setEditingNoteId(null);
      setNoteText("");
    } catch (err) {
      alert("Failed to save notes");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "App ID", "Name", "Email", "Phone", "Position", "Job ID", "Status",
      "Source", "Work Authorization", "Applied Date", "Rating", "City", "State",
      "Skills", "Notes", "Assigned To", "Talent Bench"
    ];
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

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to get resume");
      }

      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      alert("Failed to load resume. The file may have been deleted.");
    }
  };

  const handleDeleteApplication = async (appId: string, appName: string) => {
    if (!confirm(`Are you sure you want to delete the application from ${appName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete application");
      }

      setApplications((prev) => prev.filter((app) => app.id !== appId));
      setExpandedId(null);
    } catch (err) {
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

      if (!response.ok) {
        throw new Error("Failed to duplicate application");
      }

      await fetchData();
      alert("Application duplicated successfully");
    } catch (err) {
      alert("Failed to duplicate application");
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      source: "",
      status: "pending",
      jobId: "",
      jobTitle: "",
      ownership: "",
      ownershipName: "",
      workAuthorization: "",
      rating: 0,
      notes: "",
      addToTalentBench: false,
      skills: [],
      experience: "",
      coverLetter: "",
    });
    setHoverRating(0);
  };

  const handleCreateNew = () => {
    resetForm();
    setSelectedApplication(null);
    setPageMode("create");
  };

  const handleEditApplication = (app: ApplicationWithJob) => {
    setSelectedApplication(app);
    setFormData({
      firstName: app.firstName || app.name?.split(" ")[0] || "",
      lastName: app.lastName || app.name?.split(" ").slice(1).join(" ") || "",
      phone: app.phone || "",
      email: app.email,
      address: app.address || "",
      city: app.city || "",
      state: app.state || "",
      zipCode: app.zipCode || "",
      source: app.source || "",
      status: app.status,
      jobId: app.jobId || "",
      jobTitle: app.jobTitle || "",
      ownership: app.ownership || "",
      ownershipName: app.ownershipName || "",
      workAuthorization: app.workAuthorization || "",
      rating: app.rating || 0,
      notes: app.notes || "",
      addToTalentBench: app.addToTalentBench || false,
      skills: app.skills || [],
      experience: app.experience || "",
      coverLetter: app.coverLetter || "",
    });
    setPageMode("edit");
  };

  const handleViewApplication = (app: ApplicationWithJob) => {
    setSelectedApplication(app);
    setPageMode("view");
  };

  const handleJobSelect = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    setFormData({
      ...formData,
      jobId: jobId,
      jobTitle: job?.title || "",
    });
  };

  const handleOwnershipSelect = (userId: string) => {
    const selectedUser = hrUsers.find((u) => u.id === userId);
    setFormData({
      ...formData,
      ownership: userId,
      ownershipName: selectedUser?.name || selectedUser?.email || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error("Please fill in all required fields (First Name, Last Name, Email)");
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
        rating: formData.rating || undefined,
        notes: formData.notes || undefined,
        addToTalentBench: formData.addToTalentBench,
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        experience: formData.experience || undefined,
        coverLetter: formData.coverLetter || undefined,
        createdBy: user?.id || "system",
        createdByName: user?.name || user?.email?.split("@")[0] || "System",
      };

      let response;
      if (pageMode === "edit" && selectedApplication) {
        response = await fetch(`/api/applications/${selectedApplication.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(applicationData),
        });
      } else {
        response = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(applicationData),
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
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending" || a.status === "active").length,
    reviewing: applications.filter(
      (a) => a.status === "reviewing" || a.status === "interview"
    ).length,
    hired: applications.filter((a) => a.status === "hired").length,
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-sm">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-rose-500 text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render Create/Edit Form
  if (pageMode === "create" || pageMode === "edit") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setPageMode("list"); resetForm(); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {pageMode === "create" ? "New Application" : "Edit Application"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {pageMode === "create" ? "Create a new candidate application" : `Editing: ${selectedApplication?.name}`}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john.doe@example.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Application Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Application Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(v) => setFormData({ ...formData, source: v as Application["source"] })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Indeed">Indeed</SelectItem>
                        <SelectItem value="Company Website">Company Website</SelectItem>
                        <SelectItem value="Career Portal">Career Portal</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Agency">Agency</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Application["status"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="offered">Offered</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Position</Label>
                    <Select value={formData.jobId} onValueChange={handleJobSelect}>
                      <SelectTrigger><SelectValue placeholder="Select a job (optional)" /></SelectTrigger>
                      <SelectContent>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.postingId ? `${job.postingId} - ` : ""}{job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="Auto-populated or enter manually"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assigned To</Label>
                    <Select value={formData.ownership} onValueChange={handleOwnershipSelect}>
                      <SelectTrigger><SelectValue placeholder="Assign to team member" /></SelectTrigger>
                      <SelectContent>
                        {hrUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name || u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Work Authorization</Label>
                    <Select
                      value={formData.workAuthorization}
                      onValueChange={(v) => setFormData({ ...formData, workAuthorization: v as Application["workAuthorization"] })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select authorization" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US Citizen">US Citizen</SelectItem>
                        <SelectItem value="Green Card">Green Card</SelectItem>
                        <SelectItem value="H1-B">H1-B</SelectItem>
                        <SelectItem value="OPT/CPT">OPT/CPT</SelectItem>
                        <SelectItem value="TN Visa">TN Visa</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Rating & Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rating & Notes
                </h3>

                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoverRating || formData.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300 hover:text-amber-300"
                          }`}
                        />
                      </button>
                    ))}
                    {formData.rating > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: 0 })}
                        className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                    placeholder="Add any additional comments about this candidate..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="addToTalentBench"
                    checked={formData.addToTalentBench}
                    onCheckedChange={(checked) => setFormData({ ...formData, addToTalentBench: checked as boolean })}
                  />
                  <Label htmlFor="addToTalentBench" className="text-sm font-normal cursor-pointer">
                    Add candidate to talent bench for future opportunities
                  </Label>
                </div>
              </div>

              <Separator />

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setPageMode("list"); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {pageMode === "create" ? "Create Application" : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render View Application Details
  if (pageMode === "view" && selectedApplication) {
    const app = selectedApplication;
    const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => { setPageMode("list"); setSelectedApplication(null); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{app.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${status.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                  {status.label}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {app.applicationId || `ID: ${app.id.slice(0, 8)}`}
                {app.jobTitle && ` | ${app.jobTitle}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEditApplication(app)}>
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDuplicateApplication(app)}>
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">{app.email}</a>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p>{app.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p>{[app.address, app.city, app.state, app.zipCode].filter(Boolean).join(", ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Work Authorization</p>
                    <p>{app.workAuthorization || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Application Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Job Position</p>
                    <p>{app.jobTitle || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Job ID</p>
                    <p>{app.jobId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p>{app.source || "Career Portal"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Applied Date</p>
                    <p>{formatDate(app.appliedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p>{app.ownershipName || app.postedByName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Talent Bench</p>
                    <p>{app.addToTalentBench ? "Yes" : "No"}</p>
                  </div>
                </div>
                {app.skills && app.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {app.skills.map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {app.experience && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Experience</p>
                    <p className="text-sm">{app.experience}</p>
                  </div>
                )}
                {app.coverLetter && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Cover Letter</p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{app.coverLetter}</p>
                  </div>
                )}
                {app.notes && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">{app.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Status Timeline
                </h3>
                {app.statusHistory && app.statusHistory.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {[...app.statusHistory].reverse().map((entry, idx) => {
                        const entryStatus = statusConfig[entry.status as keyof typeof statusConfig] || statusConfig.pending;
                        return (
                          <div key={idx} className="relative pl-10">
                            <div className={`absolute left-2.5 w-3 h-3 rounded-full ${entryStatus.dotColor} border-2 border-white shadow`} />
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entryStatus.color}`}>
                                  {entryStatus.label}
                                </span>
                                <span className="text-xs text-gray-500">{formatDate(entry.changedAt)}</span>
                              </div>
                              {entry.changedByName && (
                                <p className="text-xs text-gray-500">Changed by {entry.changedByName}</p>
                              )}
                              {entry.notes && (
                                <p className="text-sm text-gray-700 mt-1">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No status history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Select value={app.status} onValueChange={(v) => handleStatusChange(app.id, v as Application["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <a
                    href={`mailto:${app.email}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </a>
                  {app.phone && (
                    <a
                      href={`tel:${app.phone}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                  )}
                  {app.resumeId && (
                    <button
                      onClick={() => handleViewResume(app.resumeId!)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      View Resume
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rating */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Rating</h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingChange(app.id, star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= (app.rating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300 hover:text-amber-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Application ID</p>
                    <p className="font-mono">{app.applicationId || app.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p>{formatDate(app.createdAt || app.appliedAt)}</p>
                  </div>
                  {app.updatedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p>{formatDate(app.updatedAt)}</p>
                    </div>
                  )}
                  {app.createdByName && (
                    <div>
                      <p className="text-xs text-muted-foreground">Created By</p>
                      <p>{app.createdByName}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render List View (default)
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage all job applications and candidates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Table view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "cards"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={filteredApplications.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Application</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending/Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Eye className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.reviewing}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.hired}</p>
              <p className="text-xs text-gray-500">Hired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, app ID, or job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-all whitespace-nowrap ${
                showFilters || statusFilter !== "all" || positionFilter !== "all" || sourceFilter !== "all"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="interview">Interview</option>
                    <option value="offered">Offered</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Position</label>
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Positions</option>
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Sources</option>
                    {sources.map((src) => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Assigned To</label>
                  <select
                    value={recruiterFilter}
                    onChange={(e) => setRecruiterFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All</option>
                    {recruiters.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              {dateRange === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">From:</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                  />
                  <label className="text-xs font-medium text-gray-500">To:</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {filteredApplications.length} of {applications.length} applications
        </p>
      </div>

      {/* Table View */}
      {viewMode === "table" && filteredApplications.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">App ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Job / Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Applied</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((app) => {
                  const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-600">{app.applicationId || app.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs">
                            {(app.name || "NA").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <button
                              onClick={() => handleViewApplication(app)}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {app.name || "Unknown"}
                            </button>
                            <p className="text-xs text-gray-500">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{app.jobTitle || "-"}</p>
                        <p className="text-xs text-gray-500 font-mono">{app.jobId ? app.jobId.slice(0, 8) : "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">{app.source || "Portal"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => handleRatingChange(app.id, star)}>
                              <Star className={`w-3.5 h-3.5 ${star <= (app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">{formatTimeAgo(app.appliedAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                          className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer ${status.color}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="interview">Interview</option>
                          <option value="offered">Offered</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewApplication(app)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditApplication(app)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <a
                            href={`mailto:${app.email}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteApplication(app.id, app.name || "this applicant")}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((app) => {
              const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-200 transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                          {(app.name || "NA").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <button
                            onClick={() => handleViewApplication(app)}
                            className="font-medium text-gray-900 hover:text-blue-600 text-sm text-left"
                          >
                            {app.name || "Unknown"}
                          </button>
                          <p className="text-xs text-gray-500 font-mono">{app.applicationId || app.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                        {status.label}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{app.jobTitle || "No position"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{app.email}</span>
                      </div>
                      {app.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{app.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => handleRatingChange(app.id, star)}>
                            <Star className={`w-4 h-4 ${star <= (app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{formatTimeAgo(app.appliedAt)}</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewApplication(app)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-md"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditApplication(app)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-md"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <a href={`mailto:${app.email}`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-md">
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                      className="px-2 py-1 text-xs border border-gray-200 rounded bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="interview">Interview</option>
                      <option value="offered">Offered</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-lg border border-gray-200 p-8 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {applications.length === 0 ? "No applications yet" : "No applications match your filters"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredApplications.length === 0 && viewMode === "table" && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {applications.length === 0 ? "No applications yet" : "No applications match your filters"}
          </p>
          {applications.length === 0 && (
            <button
              onClick={handleCreateNew}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create First Application
            </button>
          )}
        </div>
      )}
    </div>
  );
}
