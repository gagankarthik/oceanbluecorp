"use client";

import { useState, useEffect } from "react";
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
  MapPin,
  Briefcase,
  FileText,
  Bell,
  Users,
  Truck,
  Search,
} from "lucide-react";
import { Job, Client, Vendor } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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

interface CognitoUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

export default function NewJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [hrUsers, setHrUsers] = useState<CognitoUser[]>([]);
  const [allUsers, setAllUsers] = useState<CognitoUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [notificationSearch, setNotificationSearch] = useState("");
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

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
    notifyHROnApplication: false,
    notifyAdminOnApplication: false,
    clientId: "",
    clientName: "",
    clientNotes: "",
    vendorId: "",
    vendorName: "",
    recruitmentManagerId: "",
    recruitmentManagerName: "",
    recruitmentManagerEmail: "",
    assignedToId: "",
    assignedToName: "",
    sendEmailNotification: [] as string[], // Additional HR/admin emails
  });

  const [clientFormData, setClientFormData] = useState({
    name: "",
    websiteUrl: "",
    email: "",
    phone: "",
    status: "active" as "active" | "inactive",
  });
  const [clientSubmitting, setClientSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchVendors();
    fetchUsers();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?status=active");
      const data = await response.json();
      if (response.ok) setClients(data.clients || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      const data = await response.json();
      if (response.ok) setVendors(data.vendors || []);
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
        notifyHROnApplication: formData.notifyHROnApplication,
        notifyAdminOnApplication: formData.notifyAdminOnApplication,
        clientId: formData.clientId || undefined,
        clientName: formData.clientName || undefined,
        clientNotes: formData.clientNotes || undefined,
        vendorId: formData.vendorId || undefined,
        vendorName: formData.vendorName || undefined,
        recruitmentManagerId: formData.recruitmentManagerId || undefined,
        recruitmentManagerName: formData.recruitmentManagerName || undefined,
        recruitmentManagerEmail: formData.recruitmentManagerEmail || undefined,
        assignedToId: formData.assignedToId || undefined,
        assignedToName: formData.assignedToName || undefined,
        sendEmailNotification: formData.sendEmailNotification,
        postedByName: user?.name || user?.email?.split("@")[0] || "Admin",
        postedByEmail: user?.email || "",
        postedByRole: user?.role || "admin",
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create job");
      }

      router.push("/admin/jobs");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create job");
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
      setFormData({ ...formData, clientId: data.client.id, clientName: data.client.name });
      setClientFormData({ name: "", websiteUrl: "", email: "", phone: "", status: "active" });
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
    setFormData({ ...formData, clientId, clientName: client?.name || "" });
  };

  const handleVendorSelect = (vendorId: string) => {
    if (vendorId === "none") {
      setFormData({ ...formData, vendorId: "", vendorName: "" });
      return;
    }
    const vendor = vendors.find((v) => v.id === vendorId);
    setFormData({ ...formData, vendorId, vendorName: vendor?.name || "" });
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

  const handleAssignedToSelect = (userId: string) => {
    const selectedUser = allUsers.find((u) => u.id === userId);
    setFormData({ ...formData, assignedToId: userId, assignedToName: selectedUser?.name || selectedUser?.email || "" });
  };

  const toggleEmailNotification = (email: string) => {
    const current = formData.sendEmailNotification;
    if (current.includes(email)) {
      setFormData({ ...formData, sendEmailNotification: current.filter((e) => e !== email) });
    } else {
      setFormData({ ...formData, sendEmailNotification: [...current, email] });
    }
  };

  // Compute available additional HR/admins (exclude current user since they're already the default recipient)
  const additionalRecipients = hrUsers.filter((u) => u.email !== user?.email);

  // Filtered list for the notification search dropdown (exclude already-selected)
  const filteredRecipients = additionalRecipients.filter((u) => {
    if (formData.sendEmailNotification.includes(u.email)) return false;
    if (!notificationSearch.trim()) return true;
    const q = notificationSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Job Posting</h1>
          <p className="text-muted-foreground text-sm">Create a new job listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Block 1: Basic Information ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Job["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Submission Deadline</Label>
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
          </CardContent>
        </Card>

        {/* ── Block 2: Location ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">City / Location *</Label>
              <Input
                id="location"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Columbus"
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
          </CardContent>
        </Card>

        {/* ── Block 3: Client & Vendor ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Client &amp; Vendor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
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
                <Label>Vendor</Label>
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

            {formData.clientId && formData.clientId !== "add-new" && (
              <div className="space-y-2">
                <Label htmlFor="clientNotes">Client Notes</Label>
                <Input
                  id="clientNotes"
                  value={formData.clientNotes}
                  onChange={(e) => setFormData({ ...formData, clientNotes: e.target.value })}
                  placeholder="Quick note about this client..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Block 4: Rates & Compensation ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Rates &amp; Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientBillRate">Client Bill Rate ($/hr)</Label>
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
              <Label htmlFor="payRate">Pay Rate ($/hr)</Label>
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
            <div className="space-y-2">
              <Label htmlFor="salaryMin">Min Salary (Annual)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  placeholder="80,000"
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
                  placeholder="120,000"
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Block 5: Team Assignments ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Team Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={formData.assignedToId} onValueChange={handleAssignedToSelect}>
                <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Block 6: Job Details ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                placeholder="Describe the role and responsibilities..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <p className="text-xs text-muted-foreground">One per line</p>
                <textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                  placeholder={"5+ years experience\nBachelor's degree..."}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <p className="text-xs text-muted-foreground">One per line</p>
                <textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                  placeholder={"Lead technical projects\nMentor junior developers..."}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Block 7: Email Notifications ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Default recipient notice */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Bell className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Default Recipient</p>
                <p className="text-sm text-blue-700">
                  Notifications will automatically be sent to{" "}
                  <span className="font-semibold">{user?.name || user?.email}</span>{" "}
                  ({user?.email}) — the job creator.
                </p>
              </div>
            </div>

            {/* Additional notify options */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notifyHR"
                  checked={formData.notifyHROnApplication}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyHROnApplication: checked as boolean })}
                />
                <Label htmlFor="notifyHR" className="text-sm font-normal cursor-pointer">
                  Notify <span className="font-medium">all HR team</span> on new applications
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notifyAdmin"
                  checked={formData.notifyAdminOnApplication}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyAdminOnApplication: checked as boolean })}
                />
                <Label htmlFor="notifyAdmin" className="text-sm font-normal cursor-pointer">
                  Notify <span className="font-medium">all Administrators</span> on new applications
                </Label>
              </div>
            </div>

            <Separator />

            {/* Additional individual HR/Admin recipients */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Additional Individual Recipients</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Search and add specific HR/Admin members to also receive job posting notifications.
              </p>

              {/* Search input + dropdown */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name, email or role…"
                  value={notificationSearch}
                  onChange={(e) => {
                    setNotificationSearch(e.target.value);
                    setShowNotificationDropdown(true);
                  }}
                  onFocus={() => setShowNotificationDropdown(true)}
                  onBlur={() => setTimeout(() => setShowNotificationDropdown(false), 150)}
                  className="pl-9"
                  autoComplete="off"
                />

                {/* Dropdown list */}
                {showNotificationDropdown && filteredRecipients.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden max-h-[220px] overflow-y-auto">
                    {filteredRecipients.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          toggleEmailNotification(u.email);
                          setNotificationSearch("");
                          setShowNotificationDropdown(false);
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
                {showNotificationDropdown && notificationSearch.trim() && filteredRecipients.length === 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg px-4 py-3 text-sm text-muted-foreground text-center">
                    No matching HR/Admin members found.
                  </div>
                )}
              </div>

              {/* Selected recipients as tags */}
              {formData.sendEmailNotification.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.sendEmailNotification.map((email) => {
                    const u = additionalRecipients.find((r) => r.email === email);
                    return (
                      <div
                        key={email}
                        className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-primary/5 border border-primary/20 rounded-full"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                          {(u?.name || email)[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {u?.name || email}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleEmailNotification(email)}
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
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Job Posting
          </Button>
        </div>
      </form>

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
