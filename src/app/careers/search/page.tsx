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
  CheckCircle2,
} from "lucide-react";
import type { Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth";

const departments = ["All Departments", "ERP Solutions", "Cloud Services", "Data & AI", "Salesforce", "Engineering", "IT Staffing", "Training", "PMO"];
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

const PER_PAGE_OPTIONS = [6, 12, 24] as const;

interface JobWithUI extends Job {
  postedAgo?: string;
}

export default function CareersSearchPage() {
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<JobWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedState, setSelectedState] = useState("All States");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  // Get unique locations from jobs
  const locations = useMemo(() => {
    const uniqueLocations = [...new Set(jobs.map((job) => job.location))].filter(Boolean).sort();
    return ["All Locations", ...uniqueLocations];
  }, [jobs]);

  // Get unique states from jobs (derived from the trailing part of the location, e.g. "Austin, TX" → "TX")
  const states = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((job) => {
      const parts = (job.location || "").split(",");
      if (parts.length > 1) {
        const st = parts[parts.length - 1].trim();
        if (st) set.add(st);
      }
    });
    return ["All States", ...[...set].sort()];
  }, [jobs]);

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

  // Fetch user's applications to show "Applied" badge
  useEffect(() => {
    const fetchUserApplications = async () => {
      if (!isAuthenticated || (!user?.id && !user?.email)) return;

      try {
        const jobIds = new Set<string>();
        const fetchPromises = [];

        // Fetch by user ID
        if (user?.id) {
          fetchPromises.push(fetch(`/api/applications?userId=${user.id}`));
        }

        // Also fetch by email to catch applications submitted before login
        if (user?.email) {
          fetchPromises.push(fetch(`/api/applications?userId=${encodeURIComponent(user.email)}`));
          fetchPromises.push(fetch(`/api/applications?email=${encodeURIComponent(user.email)}`));
        }

        const responses = await Promise.all(fetchPromises);
        for (const response of responses) {
          if (response.ok) {
            const data = await response.json();
            (data.applications || []).forEach((app: { jobId: string }) => {
              if (app.jobId) jobIds.add(app.jobId);
            });
          }
        }

        setAppliedJobIds(jobIds);
      } catch (err) {
        console.error("Failed to fetch user applications:", err);
      }
    };

    fetchUserApplications();
  }, [isAuthenticated, user?.id, user?.email]);

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
    const now = new Date();
    return jobs.filter((job) => {
      // Exclude jobs with passed deadlines
      if (job.submissionDueDate && new Date(job.submissionDueDate) < now) return false;

      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === "All Departments" || job.department === selectedDepartment;
      const matchesType = selectedType === "All Types" || job.type === selectedType;
      const matchesLocation = selectedLocation === "All Locations" || job.location === selectedLocation;
      const jobState = (job.location || "").split(",").pop()?.trim() || "";
      const matchesState = selectedState === "All States" || jobState === selectedState;
      const matchesRemote = !remoteOnly || job.type === "remote" || job.location.toLowerCase().includes("remote");

      return matchesSearch && matchesDepartment && matchesType && matchesLocation && matchesState && matchesRemote;
    });
  }, [jobs, searchQuery, selectedDepartment, selectedType, selectedLocation, selectedState, remoteOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("All Departments");
    setSelectedType("All Types");
    setSelectedLocation("All Locations");
    setSelectedState("All States");
    setRemoteOnly(false);
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    selectedDepartment !== "All Departments",
    selectedType !== "All Types",
    selectedLocation !== "All Locations",
    selectedState !== "All States",
    remoteOnly,
  ].filter(Boolean).length;

  return (
    <div className="horizon bg-[var(--hz-canvas)]">
      {/* Hero */}
      <section className="relative pt-32 pb-10 sm:pb-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="hz-display text-[2.25rem] text-[var(--hz-text)] sm:text-[3rem]">Open positions.</h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--hz-text-mute)]">
              Find your next role at Ocean Blue — filter by team, type, and location.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-16 md:py-20 bg-gray-50" id="openings">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-gray-500">
              {loading ? "Loading positions..." : `${filteredJobs.length} Jobs available`}
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
                    <span className="px-2 py-0.5 bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] text-xs font-medium rounded-full">
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
                    <button onClick={clearFilters} className="text-sm text-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)] font-medium">
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
                      type="search"
                      autoComplete="off"
                      aria-label="Search jobs by title or keyword"
                      placeholder="Job title or keyword..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hz-cobalt)] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hz-cobalt)] focus:border-transparent"
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hz-cobalt)] focus:border-transparent"
                  >
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>{type === "All Types" ? type : formatJobType(type)}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hz-cobalt)] focus:border-transparent"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* State */}
                {states.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => { setSelectedState(e.target.value); setCurrentPage(1); }}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hz-cobalt)] focus:border-transparent"
                    >
                      {states.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Remote Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setRemoteOnly(!remoteOnly); setCurrentPage(1); }}
                    className={`w-11 h-6 py-2 -my-2 rounded-full transition-colors relative ${remoteOnly ? "bg-[var(--hz-cobalt)]" : "bg-gray-200"}`}
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
                  <Loader2 className="w-10 h-10 text-[var(--hz-cobalt)] mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Loading positions...</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[var(--hz-cobalt)] text-white rounded-lg">
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
                          <Link href={`/careers/search/${job.id}`} className="flex-1 group cursor-pointer min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {appliedJobIds.has(job.id) && (
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Applied
                                </span>
                              )}
                              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                {job.department}
                              </span>
                              {(job.type === "remote" || job.location.toLowerCase().includes("remote")) && (
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                  Remote
                                </span>
                              )}
                              <span className="px-3 py-1 rounded-full bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] text-xs font-medium">
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[var(--hz-cobalt)] transition-colors break-words">{job.title}</h3>
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
                              href={`/careers/search/${job.id}`}
                              className="px-5 py-2.5 bg-gradient-to-r from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all flex items-center gap-1.5"
                            >
                              View <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination + Per-page */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredJobs.length)}–{Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} positions
                    </p>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-lg font-medium ${currentPage === page ? "bg-[var(--hz-cobalt)] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Per-page selector */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Jobs per page:</span>
                      <div className="flex items-center gap-1">
                        {PER_PAGE_OPTIONS.map((n) => (
                          <button
                            key={n}
                            onClick={() => { setItemsPerPage(n); setCurrentPage(1); }}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${itemsPerPage === n ? "bg-[var(--hz-cobalt)] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          onClick={() => { setItemsPerPage(filteredJobs.length || 999); setCurrentPage(1); }}
                          className={`px-3 h-9 rounded-lg font-medium transition-colors text-xs ${itemsPerPage >= filteredJobs.length && filteredJobs.length > 0 ? "bg-[var(--hz-cobalt)] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                        >
                          All
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No positions found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
                  <button onClick={clearFilters} className="px-4 py-2 bg-[var(--hz-cobalt)] text-white font-medium rounded-lg">
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
