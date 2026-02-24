"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { Job } from "@/lib/aws/dynamodb";

const departments = ["All Departments", "ERP Solutions", "Cloud Services", "Data & AI", "Salesforce", "IT Staffing", "Training", "PMO"];
const jobTypes = ["All Types", "full-time", "part-time", "contract", "contract-to-hire", "direct-hire", "managed-teams", "remote"];

// Format job type for display
const formatJobType = (type: string) => {
  const typeMap: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    "contract": "Contract",
    "contract-to-hire": "Contract-to-Hire",
    "direct-hire": "Direct Hire",
    "managed-teams": "Managed Teams",
    "remote": "Remote",
  };
  return typeMap[type] || type;
};

// Format due date
const formatDueDate = (dueDate: string | undefined): { text: string; isUrgent: boolean } | null => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Closed", isUrgent: true };
  if (diffDays === 0) return { text: "Due Today", isUrgent: true };
  if (diffDays === 1) return { text: "Due Tomorrow", isUrgent: true };
  if (diffDays <= 7) return { text: `${diffDays} days left`, isUrgent: true };
  return { text: `Due ${due.toLocaleDateString()}`, isUrgent: false };
};

const ITEMS_PER_PAGE = 6;

interface JobWithUI extends Job {
  postedAgo?: string;
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedType, setSelectedType] = useState("All Types");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/jobs?status=active");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch jobs");
        }

        // Add "posted ago" calculation
        const jobsWithTime = (data.jobs || []).map((job: Job) => ({
          ...job,
          postedAgo: getTimeAgo(new Date(job.createdAt)),
        }));

        setJobs(jobsWithTime);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === "All Departments" || job.department === selectedDepartment;
      const matchesType = selectedType === "All Types" || job.type === selectedType;
      const matchesRemote = !remoteOnly || job.type === "remote" || job.location.toLowerCase().includes("remote");

      return matchesSearch && matchesDepartment && matchesType && matchesRemote;
    });
  }, [jobs, searchQuery, selectedDepartment, selectedType, remoteOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("All Departments");
    setSelectedType("All Types");
    setRemoteOnly(false);
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    selectedDepartment !== "All Departments",
    selectedType !== "All Types",
    remoteOnly,
  ].filter(Boolean).length;

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pb-28 overflow-hidden">
        {/* Animated background orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-40"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-100 rounded-full blur-3xl opacity-40"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4"
            >
              Careers at Ocean Blue
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="heading-section text-gray-900 mb-6"
            >
              Build Your{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                  Future
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-blue-200 to-cyan-200 opacity-50 -z-0 rounded-full"
                  style={{ originX: 0 }}
                />
              </span>{" "}
              With Us
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              Join a team of innovators, problem-solvers, and technology experts who are shaping the future of enterprise IT.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-6 text-gray-600"
            >
              {[
                { icon: Building2, label: "50+ Employees" },
                { icon: Globe, label: "3 Locations" },
                { icon: Briefcase, label: `${jobs.length} Open Positions` },
              ].map((stat, index) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-16 md:py-20 bg-gray-50" id="openings">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block">Open Positions</span>
            <h2 className="heading-subsection text-gray-900 mb-4">
              Find your next{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">opportunity</span>
            </h2>
            <p className="text-gray-500">
              {loading ? "Loading positions..." : `${filteredJobs.length} positions available`}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-72 flex-shrink-0">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 mb-4"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
              </button>

              <div className={`bg-white rounded-2xl border border-gray-200 p-6 sticky top-24 ${showMobileFilters ? "block" : "hidden lg:block"}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Clear all
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Job title or keyword..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Job Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>{type === "All Types" ? type : formatJobType(type)}</option>
                    ))}
                  </select>
                </div>

                {/* Remote Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setRemoteOnly(!remoteOnly); setCurrentPage(1); }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${remoteOnly ? "bg-blue-600" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${remoteOnly ? "left-6" : "left-1"}`} />
                  </button>
                  <span className="text-sm text-gray-700">Remote only</span>
                </div>
              </div>
            </div>

            {/* Job Listings */}
            <div className="flex-1">
              {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Loading positions...</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Retry
                  </button>
                </div>
              ) : paginatedJobs.length > 0 ? (
                <>
                  <div className="grid gap-4">
                    {paginatedJobs.map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className="bg-white rounded-2xl border border-gray-200 p-6 transition-all hover:border-gray-300 hover:shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <Link href={`/careers/${job.id}`} className="flex-1 group cursor-pointer">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                {job.department}
                              </span>
                              {(job.type === "remote" || job.location.toLowerCase().includes("remote")) && (
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                  Remote
                                </span>
                              )}
                              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                {formatJobType(job.type)}
                              </span>
                              {(() => {
                                const dueInfo = formatDueDate(job.submissionDueDate);
                                if (!dueInfo) return null;
                                return (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                    dueInfo.isUrgent ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                                  }`}>
                                    <CalendarClock className="w-3 h-3" />
                                    {dueInfo.text}
                                  </span>
                                );
                              })()}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </span>
                              {job.salary && (
                                <span className="flex items-center gap-1.5">
                                  <DollarSign className="w-4 h-4" />
                                  {job.salary.currency}{job.salary.min.toLocaleString()} - {job.salary.currency}{job.salary.max.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </Link>
                          <div className="flex sm:flex-col items-center sm:items-end gap-3">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {job.postedAgo}
                            </span>
                            <Link
                              href={`/careers/${job.id}`}
                              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all flex items-center gap-1.5"
                            >
                              View <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium ${
                              currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No positions found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
                  <button onClick={clearFilters} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg">
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
