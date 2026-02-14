"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
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
} from "lucide-react";

// Sample application data
const initialApplications = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    position: "Senior SAP Consultant",
    department: "ERP Solutions",
    experience: "8 years",
    education: "MS Computer Science, Stanford",
    status: "pending",
    appliedDate: "2024-01-18",
    resume: "john_smith_resume.pdf",
    coverLetter: true,
    skills: ["SAP HANA", "SAP S/4", "ABAP", "SAP Fiori"],
    rating: 4,
    notes: "",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 234-5678",
    location: "Seattle, WA",
    position: "Cloud Solutions Architect",
    department: "Cloud Services",
    experience: "10 years",
    education: "BS Computer Engineering, MIT",
    status: "reviewing",
    appliedDate: "2024-01-17",
    resume: "sarah_johnson_resume.pdf",
    coverLetter: true,
    skills: ["AWS", "Azure", "Kubernetes", "Terraform"],
    rating: 5,
    notes: "Strong candidate, schedule interview",
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+1 (555) 345-6789",
    location: "New York, NY",
    position: "Salesforce Developer",
    department: "CRM",
    experience: "5 years",
    education: "BS Information Systems, NYU",
    status: "interview",
    appliedDate: "2024-01-15",
    resume: "michael_chen_resume.pdf",
    coverLetter: false,
    skills: ["Salesforce", "Apex", "Lightning", "Visualforce"],
    rating: 4,
    notes: "Interview scheduled for Jan 22",
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.d@email.com",
    phone: "+1 (555) 456-7890",
    location: "Chicago, IL",
    position: "Data Analyst",
    department: "Analytics",
    experience: "3 years",
    education: "MS Data Science, Northwestern",
    status: "rejected",
    appliedDate: "2024-01-14",
    resume: "emily_davis_resume.pdf",
    coverLetter: true,
    skills: ["Python", "SQL", "Tableau", "Machine Learning"],
    rating: 2,
    notes: "Does not meet experience requirements",
  },
  {
    id: 5,
    name: "Robert Wilson",
    email: "r.wilson@email.com",
    phone: "+1 (555) 567-8901",
    location: "Austin, TX",
    position: "Project Manager",
    department: "Operations",
    experience: "7 years",
    education: "MBA, UT Austin",
    status: "offered",
    appliedDate: "2024-01-12",
    resume: "robert_wilson_resume.pdf",
    coverLetter: true,
    skills: ["PMP", "Agile", "Scrum", "JIRA"],
    rating: 5,
    notes: "Offer sent, awaiting response",
  },
  {
    id: 6,
    name: "Lisa Anderson",
    email: "lisa.a@email.com",
    phone: "+1 (555) 678-9012",
    location: "Remote",
    position: "Machine Learning Engineer",
    department: "AI & Data",
    experience: "6 years",
    education: "PhD Machine Learning, Carnegie Mellon",
    status: "pending",
    appliedDate: "2024-01-18",
    resume: "lisa_anderson_resume.pdf",
    coverLetter: true,
    skills: ["TensorFlow", "PyTorch", "Python", "MLOps"],
    rating: 0,
    notes: "",
  },
  {
    id: 7,
    name: "David Kim",
    email: "d.kim@email.com",
    phone: "+1 (555) 789-0123",
    location: "Los Angeles, CA",
    position: "DevOps Engineer",
    department: "Cloud Services",
    experience: "4 years",
    education: "BS Computer Science, UCLA",
    status: "reviewing",
    appliedDate: "2024-01-16",
    resume: "david_kim_resume.pdf",
    coverLetter: false,
    skills: ["Docker", "Jenkins", "CI/CD", "Linux"],
    rating: 3,
    notes: "",
  },
  {
    id: 8,
    name: "Jennifer Martinez",
    email: "j.martinez@email.com",
    phone: "+1 (555) 890-1234",
    location: "Miami, FL",
    position: "Senior SAP Consultant",
    department: "ERP Solutions",
    experience: "12 years",
    education: "MS Business Analytics, FIU",
    status: "hired",
    appliedDate: "2024-01-08",
    resume: "jennifer_martinez_resume.pdf",
    coverLetter: true,
    skills: ["SAP ECC", "SAP HANA", "SAP BW", "ABAP"],
    rating: 5,
    notes: "Started on Jan 22",
  },
];

const statusConfig = {
  pending: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  reviewing: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-700",
    icon: Eye,
  },
  interview: {
    label: "Interview",
    color: "bg-purple-100 text-purple-700",
    icon: MessageSquare,
  },
  offered: {
    label: "Offer Sent",
    color: "bg-cyan-100 text-cyan-700",
    icon: Mail,
  },
  hired: {
    label: "Hired",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState(initialApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<number | null>(null);

  const positions = [...new Set(applications.map((a) => a.position))];

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter;
    const matchesPosition =
      positionFilter === "all" || app.position === positionFilter;
    return matchesSearch && matchesStatus && matchesPosition;
  });

  const handleStatusChange = (appId: number, newStatus: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, status: newStatus } : app
      )
    );
  };

  const handleRatingChange = (appId: number, rating: number) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, rating } : app))
    );
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewing: applications.filter(
      (a) => a.status === "reviewing" || a.status === "interview"
    ).length,
    hired: applications.filter((a) => a.status === "hired").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">
            Review and manage job applications
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Applications</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.reviewing}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.hired}</p>
              <p className="text-sm text-gray-600">Hired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="interview">Interview</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">All Positions</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications list */}
      <div className="space-y-4">
        {filteredApplications.map((app) => {
          const status = statusConfig[app.status as keyof typeof statusConfig];
          const isExpanded = expandedId === app.id;

          return (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors"
            >
              {/* Main row */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : app.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold">
                      {app.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {app.name}
                        </h3>
                        {/* Rating */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRatingChange(app.id, star);
                              }}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  star <= app.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {app.position}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {app.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(app.appliedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      <status.icon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Contact & Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">
                        Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <a
                          href={`mailto:${app.email}`}
                          className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                        >
                          <Mail className="w-4 h-4" />
                          {app.email}
                        </a>
                        <a
                          href={`tel:${app.phone}`}
                          className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                        >
                          <Phone className="w-4 h-4" />
                          {app.phone}
                        </a>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {app.location}
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-gray-500">Experience</p>
                        <p className="font-medium text-gray-900">
                          {app.experience}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Education</p>
                        <p className="font-medium text-gray-900">
                          {app.education}
                        </p>
                      </div>
                    </div>

                    {/* Skills & Resume */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {app.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="pt-2 space-y-2">
                        <h4 className="font-semibold text-gray-900">
                          Documents
                        </h4>
                        <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                          <FileText className="w-4 h-4" />
                          {app.resume}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        {app.coverLetter && (
                          <span className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Cover letter included
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">
                        Update Status
                      </h4>
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="reviewing">Under Review</option>
                        <option value="interview">Interview</option>
                        <option value="offered">Offer Sent</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          defaultValue={app.notes}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                          rows={3}
                          placeholder="Add internal notes..."
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          Send Email
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredApplications.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No applications found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
