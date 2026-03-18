"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Calendar,
  Building2,
  UserCheck,
  Globe,
  Plus,
  X,
  Truck,
  Search,
} from "lucide-react";
import { Job, Client, Vendor } from "@/lib/aws/dynamodb";

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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming", "Remote"
];

const departments = [
  "ERP Solutions",
  "Cloud Services",
  "Data & AI",
  "Salesforce",
  "IT Staffing",
  "Training",
  "PMO",
  "Operations",
];

interface CognitoUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [hrUsers, setHrUsers] = useState<CognitoUser[]>([]);
  const [allUsers, setAllUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [job, setJob] = useState<Job | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    department: "ERP Solutions",
    location: "",
    state: "",
    type: "full-time" as Job["type"],
    description: "",
    requirements: "",
    responsibilities: "",
    salaryMin: "",
    salaryMax: "",
    clientBillRate: "",
    payRate: "",
    status: "draft" as Job["status"],
    submissionDueDate: "",
    clientId: "",
    clientName: "",
    recruitmentManagerId: "",
    recruitmentManagerName: "",
    recruitmentManagerEmail: "",
    // Multi-select assignees
    assignedToIds: [] as string[],
    assignedToNames: [] as string[],
    assignedToEmails: [] as string[],
    vendorId: "",
    vendorName: "",
  });
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const [clientFormData, setClientFormData] = useState({
    name: "",
    websiteUrl: "",
    email: "",
    phone: "",
    status: "active" as "active" | "inactive",
  });
  const [clientSubmitting, setClientSubmitting] = useState(false);

  useEffect(() => {
    fetchJob();
    fetchClients();
    fetchVendors();
    fetchUsers();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch job");
      }

      const jobData = data.job;
      setJob(jobData);

      setFormData({
        title: jobData.title || "",
        department: jobData.department || "ERP Solutions",
        location: jobData.location || "",
        state: jobData.state || "",
        type: jobData.type || "full-time",
        description: jobData.description || "",
        requirements: jobData.requirements?.join("\n") || "",
        responsibilities: jobData.responsibilities?.join("\n") || "",
        salaryMin: jobData.salary?.min?.toString() || "",
        salaryMax: jobData.salary?.max?.toString() || "",
        clientBillRate: jobData.clientBillRate?.toString() || "",
        payRate: jobData.payRate?.toString() || "",
        status: jobData.status || "draft",
        submissionDueDate: jobData.submissionDueDate?.split("T")[0] || "",
        clientId: jobData.clientId || "",
        clientName: jobData.clientName || "",
        recruitmentManagerId: jobData.recruitmentManagerId || "",
        recruitmentManagerName: jobData.recruitmentManagerName || "",
        recruitmentManagerEmail: jobData.recruitmentManagerEmail || "",
        // Multi-select assignees - handle both old single format and new array format
        assignedToIds: jobData.assignedToIds || (jobData.assignedToId ? [jobData.assignedToId] : []),
        assignedToNames: jobData.assignedToNames || (jobData.assignedToName ? [jobData.assignedToName] : []),
        assignedToEmails: jobData.assignedToEmails || [],
        vendorId: jobData.vendorId || "",
        vendorName: jobData.vendorName || "",
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to fetch job");
      router.push("/admin/jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?status=active");
      const data = await response.json();
      if (response.ok) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      const data = await response.json();
      if (response.ok) {
        setVendors(data.vendors || []);
      }
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        const users = data.users || [];
        setAllUsers(users);
        setHrUsers(users.filter((u: CognitoUser) => u.role === "hr" || u.role === "admin"));
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const jobData = {
        title: formData.title,
        department: formData.department,
        location: formData.location,
        state: formData.state || undefined,
        type: formData.type,
        description: formData.description,
        requirements: formData.requirements.split("\n").filter(Boolean),
        responsibilities: formData.responsibilities.split("\n").filter(Boolean),
        salary: formData.salaryMin && formData.salaryMax ? {
          min: parseInt(formData.salaryMin),
          max: parseInt(formData.salaryMax),
          currency: "$",
        } : undefined,
        clientBillRate: formData.clientBillRate ? parseFloat(formData.clientBillRate) : undefined,
        payRate: formData.payRate ? parseFloat(formData.payRate) : undefined,
        status: formData.status,
        submissionDueDate: formData.submissionDueDate || undefined,
        clientId: formData.clientId || undefined,
        clientName: formData.clientName || undefined,
        recruitmentManagerId: formData.recruitmentManagerId || undefined,
        recruitmentManagerName: formData.recruitmentManagerName || undefined,
        recruitmentManagerEmail: formData.recruitmentManagerEmail || undefined,
        // Multi-select assignees
        assignedToIds: formData.assignedToIds.length > 0 ? formData.assignedToIds : undefined,
        assignedToNames: formData.assignedToNames.length > 0 ? formData.assignedToNames : undefined,
        assignedToEmails: formData.assignedToEmails.length > 0 ? formData.assignedToEmails : undefined,
        vendorId: formData.vendorId || undefined,
        vendorName: formData.vendorName || undefined,
      };

      const response = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update job");
      }

      router.push("/admin/jobs");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientSubmitting(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create client");
      }

      const data = await response.json();
      setClients((prev) => [data.client, ...prev]);
      setFormData({
        ...formData,
        clientId: data.client.id,
        clientName: data.client.name,
      });

      setClientFormData({
        name: "",
        websiteUrl: "",
        email: "",
        phone: "",
        status: "active",
      });
      setShowAddClientModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setClientSubmitting(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    if (clientId === "add-new") {
      setShowAddClientModal(true);
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    setFormData({
      ...formData,
      clientId: clientId,
      clientName: client?.name || "",
    });
  };

  const handleVendorSelect = (vendorId: string) => {
    if (vendorId === "none") {
      setFormData({ ...formData, vendorId: "", vendorName: "" });
      return;
    }
    const vendor = vendors.find((v) => v.id === vendorId);
    setFormData({
      ...formData,
      vendorId: vendorId,
      vendorName: vendor?.name || "",
    });
  };

  const handleRecruitmentManagerSelect = (userId: string) => {
    const selectedUser = hrUsers.find((u) => u.id === userId);
    setFormData({
      ...formData,
      recruitmentManagerId: userId,
      recruitmentManagerName: selectedUser?.name || selectedUser?.email || "",
      recruitmentManagerEmail: selectedUser?.email || "",
    });
  };

  const toggleAssignee = (user: CognitoUser) => {
    const { assignedToIds, assignedToNames, assignedToEmails } = formData;
    if (assignedToIds.includes(user.id)) {
      // Remove
      const idx = assignedToIds.indexOf(user.id);
      setFormData({
        ...formData,
        assignedToIds: assignedToIds.filter((_, i) => i !== idx),
        assignedToNames: assignedToNames.filter((_, i) => i !== idx),
        assignedToEmails: assignedToEmails.filter((_, i) => i !== idx),
      });
    } else {
      // Add
      setFormData({
        ...formData,
        assignedToIds: [...assignedToIds, user.id],
        assignedToNames: [...assignedToNames, user.name || user.email],
        assignedToEmails: [...assignedToEmails, user.email],
      });
    }
  };

  // Filter assignees for search (only HR/Admin, exclude already selected)
  const filteredAssignees = hrUsers.filter((u) => {
    if (formData.assignedToIds.includes(u.id)) return false;
    if (!assigneeSearch.trim()) return true;
    const q = assigneeSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
          <p className="text-muted-foreground text-sm">Loading job...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Job Posting</h1>
          <p className="text-muted-foreground text-sm">
            {job?.postingId && <span className="font-mono text-primary">{job.postingId} - </span>}
            {job?.title}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Posting ID Display */}
            {job?.postingId && (
              <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Job Posting ID:</span>
                <span className="font-mono font-semibold text-primary">{job.postingId}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Client
                  </Label>
                  <Select value={formData.clientId} onValueChange={handleClientSelect}>
                    <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="add-new">
                        <span className="flex items-center gap-2 text-primary">
                          <Plus className="h-4 w-4" />
                          Add New Client
                        </span>
                      </SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Vendor
                  </Label>
                  <Select value={formData.vendorId || "none"} onValueChange={handleVendorSelect}>
                    <SelectTrigger><SelectValue placeholder="Select a vendor (optional)" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="none">No vendor</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Job Type *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Job["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="contract-to-hire">Contract-to-Hire</SelectItem>
                      <SelectItem value="direct-hire">Direct Hire</SelectItem>
                      <SelectItem value="managed-teams">Managed Teams</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. New York, NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Job["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.submissionDueDate}
                      onChange={(e) => setFormData({ ...formData, submissionDueDate: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Rates Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Rates & Compensation</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientBillRate">Client Bill Rate ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clientBillRate"
                      type="number"
                      step="0.01"
                      value={formData.clientBillRate}
                      onChange={(e) => setFormData({ ...formData, clientBillRate: e.target.value })}
                      placeholder="75.00"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payRate">Pay Rate ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="payRate"
                      type="number"
                      step="0.01"
                      value={formData.payRate}
                      onChange={(e) => setFormData({ ...formData, payRate: e.target.value })}
                      placeholder="55.00"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Min Salary (Annual)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="salaryMin"
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                      placeholder="80000"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Max Salary (Annual)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="salaryMax"
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                      placeholder="120000"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Assignment Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Team Assignments
              </h3>
              <p className="text-xs text-muted-foreground">
                Notifications for new job postings and applications will be sent to the recruitment manager and assigned team members.
              </p>

              {/* Recruitment Manager - Single Select */}
              <div className="space-y-2">
                <Label>Recruitment Manager</Label>
                <Select value={formData.recruitmentManagerId} onValueChange={handleRecruitmentManagerSelect}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {hrUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To - Multi-select with Search */}
              <div className="space-y-2">
                <Label>Assigned To (HR/Admin)</Label>
                <p className="text-xs text-muted-foreground">
                  Search and add multiple team members to receive notifications.
                </p>

                {/* Search input + dropdown */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by name, email or role…"
                    value={assigneeSearch}
                    onChange={(e) => {
                      setAssigneeSearch(e.target.value);
                      setShowAssigneeDropdown(true);
                    }}
                    onFocus={() => setShowAssigneeDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAssigneeDropdown(false), 150)}
                    className="pl-9"
                    autoComplete="off"
                  />

                  {/* Dropdown list */}
                  {showAssigneeDropdown && filteredAssignees.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden max-h-[220px] overflow-y-auto">
                      {filteredAssignees.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            toggleAssignee(u);
                            setAssigneeSearch("");
                            setShowAssigneeDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                            {(u.name || u.email)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                            {u.role}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No results message */}
                  {showAssigneeDropdown && assigneeSearch.trim() && filteredAssignees.length === 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg px-4 py-3 text-sm text-muted-foreground text-center">
                      No matching HR/Admin members found.
                    </div>
                  )}
                </div>

                {/* Selected assignees as tags */}
                {formData.assignedToIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.assignedToIds.map((id, idx) => {
                      const u = hrUsers.find((r) => r.id === id);
                      const name = formData.assignedToNames[idx] || u?.name || u?.email || id;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-primary/5 border border-primary/20 rounded-full"
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                            {name[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {name}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize px-1 py-0">
                            {u?.role || "user"}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => u && toggleAssignee(u)}
                            className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Job Details</h3>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                  placeholder="Describe the role..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements (one per line)</Label>
                <textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                  placeholder="5+ years experience&#10;Bachelor's degree..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
                <textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                  placeholder="Lead technical projects&#10;Mentor junior developers..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md py-0">
            <div className="sticky top-0 bg-card z-10 px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Add New Client
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddClientModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    required
                    value={clientFormData.name}
                    onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                    placeholder="e.g. Acme Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL *</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="websiteUrl"
                      required
                      type="url"
                      value={clientFormData.websiteUrl}
                      onChange={(e) => setClientFormData({ ...clientFormData, websiteUrl: e.target.value })}
                      placeholder="https://example.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientFormData.email}
                      onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={clientFormData.phone}
                      onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={clientFormData.status} onValueChange={(v) => setClientFormData({ ...clientFormData, status: v as "active" | "inactive" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddClientModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={clientSubmitting}>
                    {clientSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Client
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
