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
  Truck,
  Search,
  Save,
  Eye,
  Hash,
  Clock,
  CheckCircle2,
  Award,
} from "lucide-react";
import { Job, Client, Vendor } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";

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
  "ERP Solutions", "Cloud Services", "Data & AI" , "Salesforce",
  "Information and Computers", "Training", "PMO", "Operations"
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
  const [submitting, setSubmitting] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // RECRUITER role cannot create jobs - redirect to jobs list
  useEffect(() => {
    if (user?.role === UserRole.RECRUITER) {
      router.replace("/admin/jobs");
    }
  }, [user, router]);

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
    clientNotes: "",
    vendorId: "",
    vendorName: "",
    recruitmentManagerId: "",
    recruitmentManagerName: "",
    recruitmentManagerEmail: "",
    assignedToIds: [] as string[],
    assignedToNames: [] as string[],
    assignedToEmails: [] as string[],
  });

  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const [clientFormData, setClientFormData] = useState({
    name: "", websiteUrl: "", email: "", phone: "", status: "active" as "active" | "inactive",
  });
  const [clientSubmitting, setClientSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients?status=active").then(r => r.json()).then(d => setClients(d.clients || [])),
      fetch("/api/vendors").then(r => r.json()).then(d => setVendors(d.vendors || [])),
      fetch("/api/users").then(r => r.json()).then(d => {
        const users = d.users || [];
        setHrUsers(users.filter((u: CognitoUser) => u.role === "hr" || u.role === "admin" || u.role === "sales" || u.role === "recruiter"));
      }),
    ]).catch(console.error);
  }, []);

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
        requirements: formData.requirements || undefined,
        responsibilities: formData.responsibilities || undefined,
        salary: formData.salaryMin && formData.salaryMax ? { min: parseInt(formData.salaryMin), max: parseInt(formData.salaryMax), currency: "$" } : undefined,
        clientBillRate: formData.clientBillRate ? parseFloat(formData.clientBillRate) : undefined,
        payRate: formData.payRate ? parseFloat(formData.payRate) : undefined,
        status: formData.status,
        submissionDueDate: formData.submissionDueDate || undefined,
        clientId: formData.clientId || undefined,
        clientName: formData.clientName || undefined,
        clientNotes: formData.clientNotes || undefined,
        vendorId: formData.vendorId || undefined,
        vendorName: formData.vendorName || undefined,
        recruitmentManagerId: formData.recruitmentManagerId || undefined,
        recruitmentManagerName: formData.recruitmentManagerName || undefined,
        recruitmentManagerEmail: formData.recruitmentManagerEmail || undefined,
        assignedToIds: formData.assignedToIds.length > 0 ? formData.assignedToIds : undefined,
        assignedToNames: formData.assignedToNames.length > 0 ? formData.assignedToNames : undefined,
        assignedToEmails: formData.assignedToEmails.length > 0 ? formData.assignedToEmails : undefined,
        postedByName: user?.name || user?.email?.split("@")[0] || "Admin",
        postedByEmail: user?.email || "",
        postedByRole: user?.role || "admin",
      };
      const response = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(jobData) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Failed to create job"); }
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
      const response = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clientFormData) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Failed to create client"); }
      const data = await response.json();
      setClients(prev => [data.client, ...prev]);
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
    if (clientId === "add-new") { setShowAddClientModal(true); return; }
    const client = clients.find(c => c.id === clientId);
    setFormData({ ...formData, clientId, clientName: client?.name || "" });
  };

  const handleVendorSelect = (vendorId: string) => {
    if (vendorId === "none") { setFormData({ ...formData, vendorId: "", vendorName: "" }); return; }
    const vendor = vendors.find(v => v.id === vendorId);
    setFormData({ ...formData, vendorId, vendorName: vendor?.name || "" });
  };

  const handleRecruitmentManagerSelect = (userId: string) => {
    const selectedUser = hrUsers.find(u => u.id === userId);
    setFormData({ ...formData, recruitmentManagerId: userId, recruitmentManagerName: selectedUser?.name || selectedUser?.email || "", recruitmentManagerEmail: selectedUser?.email || "" });
  };

  const toggleAssignee = (user: CognitoUser) => {
    const { assignedToIds, assignedToNames, assignedToEmails } = formData;
    if (assignedToIds.includes(user.id)) {
      const idx = assignedToIds.indexOf(user.id);
      setFormData({ ...formData, assignedToIds: assignedToIds.filter((_, i) => i !== idx), assignedToNames: assignedToNames.filter((_, i) => i !== idx), assignedToEmails: assignedToEmails.filter((_, i) => i !== idx) });
    } else {
      setFormData({ ...formData, assignedToIds: [...assignedToIds, user.id], assignedToNames: [...assignedToNames, user.name || user.email], assignedToEmails: [...assignedToEmails, user.email] });
    }
  };

  const filteredAssignees = hrUsers.filter(u => !formData.assignedToIds.includes(u.id) && (u.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) || u.email.toLowerCase().includes(assigneeSearch.toLowerCase())));

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    open: "bg-emerald-100 text-emerald-700",
    active: "bg-blue-100 text-blue-700",
    "on-hold": "bg-amber-100 text-amber-700",
    closed: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Job Posting</h1>
            <p className="text-sm text-gray-500">Fill in the details to create a new job listing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowPreviewModal(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button type="submit" form="job-form" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Job
          </button>
        </div>
      </div>

      <form id="job-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Title & Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <Briefcase className="w-4 h-4 text-blue-600" />Job Details
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Job Title <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Senior Software Engineer" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as Job["status"] })} className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${statusColors[formData.status] || ""}`}>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Department <span className="text-red-500">*</span></label>
              <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Job Type <span className="text-red-500">*</span></label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as Job["type"] })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="contract-to-hire">Contract-to-Hire</option>
                <option value="direct-hire">Direct Hire</option>
                <option value="managed-teams">Managed Teams</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">City/Location <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Columbus" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">State</label>
              <select value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                <option value="">Select state</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Client, Vendor, Deadline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Building2 className="w-4 h-4 text-purple-600" />Client
            </div>
            <select value={formData.clientId} onChange={e => handleClientSelect(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
              <option value="">Select client</option>
              <option value="add-new">+ Add New Client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {formData.clientId && formData.clientId !== "add-new" && (
              <input type="text" value={formData.clientNotes} onChange={e => setFormData({ ...formData, clientNotes: e.target.value })} placeholder="Client notes..." className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Truck className="w-4 h-4 text-orange-600" />Vendor
            </div>
            <select value={formData.vendorId || "none"} onChange={e => handleVendorSelect(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
              <option value="none">No vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Calendar className="w-4 h-4 text-red-600" />Submission Deadline
            </div>
            <input type="date" value={formData.submissionDueDate} onChange={e => setFormData({ ...formData, submissionDueDate: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
        </div>

        {/* Row 3: Compensation */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-600" />Compensation
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Bill Rate ($/hr)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" step="0.01" value={formData.clientBillRate} onChange={e => setFormData({ ...formData, clientBillRate: e.target.value })} placeholder="75.00" className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Pay Rate ($/hr)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" step="0.01" value={formData.payRate} onChange={e => setFormData({ ...formData, payRate: e.target.value })} placeholder="55.00" className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Min Salary (Annual)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={formData.salaryMin} onChange={e => setFormData({ ...formData, salaryMin: e.target.value })} placeholder="80,000" className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Max Salary (Annual)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={formData.salaryMax} onChange={e => setFormData({ ...formData, salaryMax: e.target.value })} placeholder="120,000" className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Team Assignments */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
            <UserCheck className="w-4 h-4 text-blue-600" />Team Assignments
          </div>
          <p className="text-xs text-gray-500 mb-4">Assign team members to receive notifications for this job posting.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Recruitment Manager</label>
              <select value={formData.recruitmentManagerId} onChange={e => handleRecruitmentManagerSelect(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                <option value="">Select manager</option>
                {hrUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Additional Assignees</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={assigneeSearch} onChange={e => { setAssigneeSearch(e.target.value); setShowAssigneeDropdown(true); }} onFocus={() => setShowAssigneeDropdown(true)} onBlur={() => setTimeout(() => setShowAssigneeDropdown(false), 150)} placeholder="Search team members..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                {showAssigneeDropdown && filteredAssignees.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredAssignees.map(u => (
                      <button key={u.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => { toggleAssignee(u); setAssigneeSearch(""); setShowAssigneeDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">{(u.name || u.email)[0].toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name || u.email}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">{u.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {formData.assignedToIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.assignedToIds.map((id, idx) => {
                    const u = hrUsers.find(r => r.id === id);
                    const name = formData.assignedToNames[idx] || u?.name || u?.email || id;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                        {name}
                        <button type="button" onClick={() => u && toggleAssignee(u)} className="p-0.5 hover:bg-blue-100 rounded-full"><X className="w-3 h-3" /></button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 5: Job Description */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <FileText className="w-4 h-4 text-gray-600" />Job Description
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role, team, and what makes this opportunity exciting..."
                rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Requirements</label>
              <textarea
                value={formData.requirements}
                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Paste or type the requirements - formatting will be preserved exactly as entered..."
                rows={8}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Responsibilities</label>
              <textarea
                value={formData.responsibilities}
                onChange={e => setFormData({ ...formData, responsibilities: e.target.value })}
                placeholder="Paste or type the responsibilities - formatting will be preserved exactly as entered..."
                rows={8}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y font-mono"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddClientModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-600" />Add New Client</h2>
              <button onClick={() => setShowAddClientModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateClient} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Client Name <span className="text-red-500">*</span></label>
                <input type="text" required value={clientFormData.name} onChange={e => setClientFormData({ ...clientFormData, name: e.target.value })} placeholder="e.g. Acme Corporation" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Website URL <span className="text-red-500">*</span></label>
                <input type="url" required value={clientFormData.websiteUrl} onChange={e => setClientFormData({ ...clientFormData, websiteUrl: e.target.value })} placeholder="https://example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                  <input type="email" value={clientFormData.email} onChange={e => setClientFormData({ ...clientFormData, email: e.target.value })} placeholder="contact@example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone</label>
                  <input type="tel" value={clientFormData.phone} onChange={e => setClientFormData({ ...clientFormData, phone: e.target.value })} placeholder="(555) 123-4567" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={clientSubmitting} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                  {clientSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-[#F2F2F2] rounded-xl shadow-2xl w-full max-w-4xl my-auto" onClick={e => e.stopPropagation()}>
            {/* Preview Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 rounded-t-xl z-10">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Public Preview</h2>
                  <p className="text-xs text-gray-500">This is how the job will appear to candidates</p>
                </div>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-6">
              {/* Job Header */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{formData.title || "Job Title"}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <Briefcase className="w-4 h-4" />
                    {formData.type === "full-time" ? "Full-time" : formData.type === "part-time" ? "Part-time" : formData.type === "contract" ? "Contract" : formData.type === "contract-to-hire" ? "Contract-to-Hire" : formData.type === "direct-hire" ? "Direct Hire" : formData.type === "managed-teams" ? "Managed Teams" : "Remote"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    <MapPin className="w-4 h-4" />
                    {formData.location || "Location"}{formData.state ? `, ${formData.state}` : ""}
                  </span>
                  {formData.submissionDueDate && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Due {new Date(formData.submissionDueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {formData.salaryMin && formData.salaryMax && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-lg font-semibold">${parseInt(formData.salaryMin).toLocaleString()} - ${parseInt(formData.salaryMax).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {formData.description && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">About This Role</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{formData.description}</p>
                </div>
              )}

              {/* Responsibilities */}
              {formData.responsibilities && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">What you'll do</h2>
                  <pre className="text-gray-600 whitespace-pre-wrap font-sans text-sm leading-relaxed">{formData.responsibilities}</pre>
                </div>
              )}

              {/* Requirements */}
              {formData.requirements && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">What we're looking for</h2>
                  <pre className="text-gray-600 whitespace-pre-wrap font-sans text-sm leading-relaxed">{formData.requirements}</pre>
                </div>
              )}

              {/* Apply CTA */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Ready to apply?</h3>
                <p className="text-blue-100 mb-4">Join our team and help shape the future of enterprise IT.</p>
                <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg cursor-default">
                  Apply for this position
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
