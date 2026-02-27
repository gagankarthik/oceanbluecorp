"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Briefcase,
  Loader2,
  LayoutGrid,
  LayoutList,
  User,
  Trash2,
  Edit3,
  Boxes,
  History,
  MapPin,
  Shield,
  Plus,
  ArrowLeft,
  X,
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
  resumeFileName?: string;
  resumeFileKey?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
  },
  reviewing: {
    label: "Reviewing",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  interview: {
    label: "Interview",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
  },
  offered: {
    label: "Offered",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dotColor: "bg-cyan-500",
  },
  hired: {
    label: "Hired",
    color: "bg-green-50 text-green-700 border-green-200",
    dotColor: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-200",
    dotColor: "bg-red-500",
  },
  active: {
    label: "Active",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  inactive: {
    label: "Inactive",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    dotColor: "bg-gray-500",
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
type PageMode = "list" | "create" | "edit" | "view";

interface CognitoUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function TalentBenchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hrUsers, setHrUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showFilters, setShowFilters] = useState(false);

  // Form states
  const [pageMode, setPageMode] = useState<PageMode>("list");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [skillInput, setSkillInput] = useState("");

  // Resume upload states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [existingResume, setExistingResume] = useState<{ id: string; fileName: string } | null>(null);

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
    status: "active" as Application["status"],
    jobId: "",
    jobTitle: "",
    ownership: "",
    ownershipName: "",
    workAuthorization: "" as Application["workAuthorization"] | "",
    rating: 0,
    notes: "",
    skills: [] as string[],
    experience: "",
    resumeId: "",
    resumeFileName: "",
    resumeFileKey: "",
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

      if (!appsResponse.ok || !jobsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      setJobs(jobsData.jobs || []);

      const jobsMap = new Map<string, Job>(
        (jobsData.jobs || []).map((job: Job) => [job.id, job])
      );

      const benchApps = (appsData.applications || [])
        .filter((app: Application) => app.addToTalentBench === true)
        .map((app: Application) => {
          const job = app.jobId ? jobsMap.get(app.jobId) : null;
          return {
            ...app,
            jobTitle: app.jobTitle || job?.title || "",
            jobDepartment: job?.department || "",
            postedByName: job?.postedByName || app.ownershipName,
          };
        });

      benchApps.sort((a: ApplicationWithJob, b: ApplicationWithJob) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      );

      setApplications(benchApps);
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

  const allSkills = [...new Set(applications.flatMap((a) => a.skills || []))];
  const workAuthorizations = [...new Set(applications.map((a) => a.workAuthorization).filter(Boolean))] as string[];

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      (app.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.applicationId?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (app.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (app.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) || false);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSkill = skillFilter === "all" || (app.skills?.includes(skillFilter) || false);
    const matchesAuth = authFilter === "all" || app.workAuthorization === authFilter;
    return matchesSearch && matchesStatus && matchesSkill && matchesAuth;
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

      if (!response.ok) throw new Error("Failed to update status");
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

      if (!response.ok) throw new Error("Failed to update rating");

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, rating } : app))
      );
    } catch (err) {
      alert("Failed to update rating");
    }
  };

  const handleRemoveFromBench = async (appId: string, appName: string) => {
    if (!confirm(`Remove ${appName} from the talent bench?`)) return;

    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addToTalentBench: false }),
      });

      if (!response.ok) throw new Error("Failed to update");
      setApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch (err) {
      alert("Failed to remove from talent bench");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "App ID", "Name", "Email", "Phone", "Last Position", "Status",
      "Work Authorization", "Skills", "Rating", "City", "State", "Has Resume", "Notes"
    ];
    const rows = filteredApplications.map((app) => [
      `"${app.applicationId || app.id.slice(0, 8)}"`,
      `"${app.name || "Unknown"}"`,
      `"${app.email}"`,
      `"${app.phone || ""}"`,
      `"${app.jobTitle || ""}"`,
      `"${app.status}"`,
      `"${app.workAuthorization || ""}"`,
      `"${app.skills?.join(", ") || ""}"`,
      `"${app.rating?.toString() || ""}"`,
      `"${app.city || ""}"`,
      `"${app.state || ""}"`,
      `"${app.resumeId ? "Yes" : "No"}"`,
      `"${(app.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talent_bench_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
      status: "active",
      jobId: "",
      jobTitle: "",
      ownership: "",
      ownershipName: "",
      workAuthorization: "",
      rating: 0,
      notes: "",
      skills: [],
      experience: "",
      resumeId: "",
      resumeFileName: "",
      resumeFileKey: "",
    });
    setHoverRating(0);
    setSkillInput("");
    setResumeFile(null);
    setResumeError(null);
    setExistingResume(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setSelectedApplication(null);
    setResumeFile(null);
    setResumeError(null);
    setExistingResume(null);
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
      skills: app.skills || [],
      experience: app.experience || "",
      resumeId: app.resumeId || "",
      resumeFileName: app.resumeFileName || "",
      resumeFileKey: app.resumeFileKey || "",
    });
    // Set existing resume info if available
    if (app.resumeId && app.resumeFileName) {
      setExistingResume({ id: app.resumeId, fileName: app.resumeFileName });
    } else {
      setExistingResume(null);
    }
    setResumeFile(null);
    setResumeError(null);
    setPageMode("edit");
  };

  const handleViewApplication = (app: ApplicationWithJob) => {
    setSelectedApplication(app);
    setPageMode("view");
  };

  const handleOwnershipSelect = (userId: string) => {
    const selectedUser = hrUsers.find((u) => u.id === userId);
    setFormData({
      ...formData,
      ownership: userId,
      ownershipName: selectedUser?.name || selectedUser?.email || "",
    });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  // Resume handlers
  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setResumeError(null);

    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setResumeError("Please upload a PDF or Word document (.pdf, .doc, .docx)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setResumeError("File size must be less than 5MB");
      return;
    }

    setResumeFile(file);
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeError(null);
  };

  const handleRemoveExistingResume = () => {
    setExistingResume(null);
    setFormData({ ...formData, resumeId: "", resumeFileName: "", resumeFileKey: "" });
  };

  const uploadResume = async (userId: string): Promise<{ resumeId: string; fileName: string; fileKey: string } | null> => {
    if (!resumeFile) return null;

    setResumeUploading(true);
    try {
      // Step 1: Get presigned upload URL
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fileName: resumeFile.name,
          fileType: resumeFile.type,
          fileSize: resumeFile.size,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { resumeId, uploadUrl, fileKey } = await response.json();

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: resumeFile,
        headers: {
          "Content-Type": resumeFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      return { resumeId, fileName: resumeFile.name, fileKey };
    } catch (err) {
      console.error("Resume upload error:", err);
      setResumeError(err instanceof Error ? err.message : "Failed to upload resume");
      return null;
    } finally {
      setResumeUploading(false);
    }
  };

  const handleDownloadResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`);
      if (!response.ok) throw new Error("Failed to get resume");

      const data = await response.json();
      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      alert("Failed to download resume");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error("Please fill in all required fields (First Name, Last Name, Email)");
      }

      // Use existing application ID for edit mode, or generate a temp user ID for new entries
      const userId = selectedApplication?.id || user?.id || `bench-${Date.now()}`;

      // Upload resume if a new file is selected
      let resumeData: { resumeId?: string; resumeFileName?: string; resumeFileKey?: string } = {};
      if (resumeFile) {
        const uploadResult = await uploadResume(userId);
        if (uploadResult) {
          resumeData = {
            resumeId: uploadResult.resumeId,
            resumeFileName: uploadResult.fileName,
            resumeFileKey: uploadResult.fileKey,
          };
        } else if (resumeError) {
          throw new Error(resumeError);
        }
      } else if (existingResume) {
        // Keep existing resume data
        resumeData = {
          resumeId: formData.resumeId,
          resumeFileName: formData.resumeFileName,
          resumeFileKey: formData.resumeFileKey,
        };
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
        addToTalentBench: true, // Always true for bench profiles
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        experience: formData.experience || undefined,
        createdBy: user?.id || "system",
        createdByName: user?.name || user?.email?.split("@")[0] || "System",
        ...resumeData,
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
        throw new Error(data.error || "Failed to save profile");
      }

      await fetchData();
      setPageMode("list");
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: applications.length,
    available: applications.filter((a) => a.status === "active" || a.status === "pending").length,
    inProcess: applications.filter((a) => a.status === "reviewing" || a.status === "interview").length,
    topRated: applications.filter((a) => (a.rating || 0) >= 4).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-sm">Loading talent bench...</p>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setPageMode("list"); resetForm(); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {pageMode === "create" ? "Add to Talent Bench" : "Edit Bench Profile"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {pageMode === "create" ? "Add a new candidate profile for future opportunities" : `Editing: ${selectedApplication?.name}`}
            </p>
          </div>
        </div>

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

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
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

              {/* Skills & Experience */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Skills & Experience
                </h3>

                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                      placeholder="Add a skill (e.g., React, Python, AWS)"
                    />
                    <Button type="button" variant="outline" onClick={handleAddSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm"
                        >
                          {skill}
                          <button type="button" onClick={() => handleRemoveSkill(skill)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Summary</Label>
                  <textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                    placeholder="Brief summary of experience and background..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Agency">Agency</SelectItem>
                        <SelectItem value="Company Website">Company Website</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Application["status"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                </div>
              </div>

              <Separator />

              {/* Resume Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Resume
                </h3>

                <div className="space-y-3">
                  {/* Existing Resume Display */}
                  {existingResume && !resumeFile && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <File className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">{existingResume.fileName}</p>
                          <p className="text-xs text-green-600">Current resume on file</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadResume(existingResume.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                          title="Download Resume"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveExistingResume}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove Resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Resume Selected */}
                  {resumeFile && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <File className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800">{resumeFile.name}</p>
                          <p className="text-xs text-blue-600">
                            {(resumeFile.size / 1024).toFixed(1)} KB - Ready to upload
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveResume}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Upload Input */}
                  {!resumeFile && (
                    <div className="relative">
                      <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleResumeSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          {existingResume ? "Upload a new resume to replace" : "Click to upload resume"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX (max 5MB)</p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {resumeError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{resumeError}</p>
                    </div>
                  )}
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
                    placeholder="Additional notes about this candidate..."
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setPageMode("list"); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || resumeUploading}>
                  {(submitting || resumeUploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {resumeUploading ? "Uploading Resume..." : pageMode === "create" ? "Add to Bench" : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render View Details
  if (pageMode === "view" && selectedApplication) {
    const app = selectedApplication;
    const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <div className="space-y-6">
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
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleEditApplication(app)}>
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p>{[app.city, app.state].filter(Boolean).join(", ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Work Authorization</p>
                    <p>{app.workAuthorization || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Experience */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Skills & Experience
                </h3>
                {app.skills && app.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {app.skills.map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {app.experience && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Experience</p>
                    <p className="text-sm">{app.experience}</p>
                  </div>
                )}
                {!app.skills?.length && !app.experience && (
                  <p className="text-gray-500 text-sm">No skills or experience recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Status Timeline */}
            {app.statusHistory && app.statusHistory.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Status Timeline
                  </h3>
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Select value={app.status} onValueChange={(v) => handleStatusChange(app.id, v as Application["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
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
                </div>
              </CardContent>
            </Card>

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

            {/* Resume Section */}
            {app.resumeId && app.resumeFileName && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold mb-4">Resume</h3>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-800 truncate">{app.resumeFileName}</p>
                      <p className="text-xs text-blue-600">Click to download</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadResume(app.resumeId!)}
                    className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download Resume
                  </button>
                </CardContent>
              </Card>
            )}

            {app.notes && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold mb-4">Notes</h3>
                  <p className="text-sm text-gray-600">{app.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p>{app.source || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p>{app.ownershipName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Added</p>
                    <p>{formatDate(app.createdAt || app.appliedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render List View
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            Talent Bench
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Candidates available for future opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "cards" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutList className="w-4 h-4" />
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
            <span className="hidden sm:inline">Add Profile</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total in Bench</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.available}</p>
              <p className="text-xs text-gray-500">Available</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.inProcess}</p>
              <p className="text-xs text-gray-500">In Process</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.topRated}</p>
              <p className="text-xs text-gray-500">Top Rated (4+)</p>
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
                placeholder="Search by name, email, skills, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-all whitespace-nowrap ${
                showFilters || statusFilter !== "all" || skillFilter !== "all" || authFilter !== "all"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="interview">Interview</option>
                    <option value="hired">Hired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Skills</label>
                  <select
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Skills</option>
                    {allSkills.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Work Authorization</label>
                  <select
                    value={authFilter}
                    onChange={(e) => setAuthFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All</option>
                    {workAuthorizations.map((auth) => (
                      <option key={auth} value={auth}>{auth}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {filteredApplications.length} of {applications.length} candidates
        </p>
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((app) => {
              const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;

              return (
                <Card key={app.id} className="hover:border-blue-200 transition-all">
                  <CardContent className="p-4">
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
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{app.email}</span>
                      </div>
                      {app.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{app.phone}</span>
                        </div>
                      )}
                      {app.workAuthorization && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Shield className="w-3.5 h-3.5 text-gray-400" />
                          <span>{app.workAuthorization}</span>
                        </div>
                      )}
                      {app.resumeId && (
                        <div className="flex items-center gap-2 text-green-600">
                          <FileText className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs">Resume on file</span>
                        </div>
                      )}
                    </div>

                    {app.skills && app.skills.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {app.skills.slice(0, 4).map((skill) => (
                            <span key={skill} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {app.skills.length > 4 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{app.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => handleRatingChange(app.id, star)}>
                            <Star className={`w-4 h-4 ${star <= (app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
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
                        {app.resumeId && (
                          <button
                            onClick={() => handleDownloadResume(app.resumeId!)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                            title="Download Resume"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <a
                          href={`mailto:${app.email}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleRemoveFromBench(app.id, app.name || "this candidate")}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Remove from Bench"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Boxes className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {applications.length === 0 ? "No candidates in the talent bench yet" : "No candidates match your filters"}
              </p>
              <button
                onClick={handleCreateNew}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add First Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && filteredApplications.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Candidate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Skills</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Work Auth</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Resume</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
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
                            <p className="text-xs text-gray-500 font-mono">{app.applicationId || app.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{app.email}</p>
                        <p className="text-xs text-gray-400">{app.phone || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {app.skills?.slice(0, 2).map((skill) => (
                            <span key={skill} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {(app.skills?.length || 0) > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              +{(app.skills?.length || 0) - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">{app.workAuthorization || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        {app.resumeId ? (
                          <button
                            onClick={() => handleDownloadResume(app.resumeId!)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
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
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                          className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer ${status.color}`}
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="interview">Interview</option>
                          <option value="hired">Hired</option>
                          <option value="inactive">Inactive</option>
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
                          {app.resumeId && (
                            <button
                              onClick={() => handleDownloadResume(app.resumeId!)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                              title="Download Resume"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={`mailto:${app.email}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleRemoveFromBench(app.id, app.name || "this candidate")}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Remove from Bench"
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

      {/* Empty State for Table View */}
      {viewMode === "table" && filteredApplications.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Boxes className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {applications.length === 0 ? "No candidates in the talent bench yet" : "No candidates match your filters"}
          </p>
          <button
            onClick={handleCreateNew}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add First Profile
          </button>
        </div>
      )}
    </div>
  );
}
