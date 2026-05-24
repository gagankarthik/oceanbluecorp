"use client";
import { toast } from "sonner";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { AdminRowsSkeleton } from "@/components/admin/skeletons";

import { useState, useEffect } from "react";
import {
  Search,
  Mail,
  Phone,
  Shield,
  Calendar,
  Trash2,
  UserCheck,
  UserX,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "hr" | "recruiter" | "sales" | "user";
  status: "active" | "inactive" | "pending";
  groups: string[];
  createdAt: string;
  lastModified?: string;
  enabled: boolean;
}

const roleConfig: Record<string, { label: string; bg: string }> = {
  admin: { label: "Admin", bg: "bg-rose-100 text-rose-800" },
  hr: { label: "HR", bg: "bg-purple-100 text-purple-800" },
  recruiter: { label: "Recruiter", bg: "bg-teal-100 text-teal-800" },
  sales: { label: "Sales", bg: "bg-amber-100 text-amber-800" },
  user: { label: "User", bg: "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]" },
};

const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
  active: { label: "Active", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  inactive: { label: "Inactive", bg: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  pending: { label: "Pending", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
};

// Role tabs — primary segmentation so each group is easy to find
const ROLE_TABS: { key: string; label: string }[] = [
  { key: "all",       label: "All Users" },
  { key: "admin",     label: "Admins" },
  { key: "hr",        label: "HR" },
  { key: "recruiter", label: "Recruiters" },
  { key: "sales",     label: "Sales" },
  { key: "user",      label: "Users" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/users");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const toggleUserSelection = (userId: string) => setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  const toggleSelectAll = () => setSelectedUsers(prev => prev.length === paginatedUsers.length ? [] : paginatedUsers.map(u => u.id));

  const handleUpdateRole = async () => {
    if (!userToEdit || !newRole) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/users/${userToEdit.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update role");
      setUsers(prev => prev.map(u => u.id === userToEdit.id ? { ...u, role: newRole as "admin" | "hr" | "recruiter" | "sales" | "user" } : u));
      setShowRoleModal(false);
      setUserToEdit(null);
      setNewRole("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/users/${userToDelete}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete user");
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update status");
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus as "active" | "inactive" } : u));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    admins: users.filter(u => u.role === "admin").length,
    pending: users.filter(u => u.status === "pending").length,
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users Management"
        subtitle="Manage user accounts, roles, and permissions"
        icon={Users}
        meta={<span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{users.length} total</span>}
        actions={
          <PageHeaderButton variant="secondary" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </PageHeaderButton>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-[var(--hz-cobalt)]", bg: "bg-[var(--hz-cobalt-100)] border-[var(--hz-cobalt-100)]" },
          { label: "Active", value: stats.active, icon: UserCheck, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Admins", value: stats.admins, icon: Shield, color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
          { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border rounded-2xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="border border-slate-200/80 rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* Role tabs */}
        <div className="border-b border-slate-200 px-2">
          <div className="flex gap-1 overflow-x-auto">
            {ROLE_TABS.map(tab => {
              const count = tab.key === "all" ? users.length : users.filter(u => u.role === tab.key).length;
              const active = selectedRole === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setSelectedRole(tab.key); setCurrentPage(1); }}
                  className={`relative flex items-center gap-2 whitespace-nowrap px-3.5 py-3 text-sm font-medium transition-colors ${
                    active ? "text-[var(--hz-cobalt)]" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    active ? "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--hz-cobalt)]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + status */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)] focus:border-[var(--hz-cobalt)]"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)] focus:border-[var(--hz-cobalt)]"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Loading */}
        {loading && <AdminRowsSkeleton rows={6} />}

        {/* Error */}
        {error && !loading && (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-2">Error loading users</h3>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button onClick={fetchUsers} className="px-4 py-2 bg-[var(--hz-cobalt)] text-white text-sm rounded-lg hover:bg-[var(--hz-cobalt-600)]">Try Again</button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-3 px-4 text-left">
                      <input type="checkbox" checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-[var(--hz-cobalt)] focus:ring-[var(--hz-cobalt)]" />
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Joined</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map(user => {
                    const roleCfg = roleConfig[user.role] || roleConfig.user;
                    const statusCfg = statusConfig[user.status] || statusConfig.pending;
                    return (
                      <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${selectedUsers.includes(user.id) ? "bg-[#eef3fe]" : ""}`}>
                        <td className="py-3.5 px-4">
                          <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleUserSelection(user.id)} className="w-4 h-4 rounded border-slate-300 text-[var(--hz-cobalt)] focus:ring-[var(--hz-cobalt)]" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--hz-cobalt)] to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {getInitials(user.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-400 lg:hidden">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 hidden lg:table-cell">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-xs text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" />{user.email}</div>
                            {user.phone && <div className="flex items-center gap-2 text-xs text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{user.phone}</div>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <button onClick={() => { setUserToEdit(user); setNewRole(user.role); setShowRoleModal(true); }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize hover:opacity-80 transition-opacity ${roleCfg.bg}`}>
                            {user.role}<ChevronDown className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <button onClick={() => handleToggleStatus(user)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize hover:opacity-80 transition-opacity ${statusCfg.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />{user.status}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 hidden xl:table-cell">
                          <span className="text-xs text-slate-500">{formatDate(user.createdAt)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end">
                            <button onClick={() => { setUserToDelete(user.id); setShowDeleteModal(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">No users found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your search or filter criteria</p>
              </div>
            )}

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="px-4 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-[var(--hz-cobalt)] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Change Role Modal */}
      {showRoleModal && userToEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Change User Role</h2>
              <button onClick={() => { setShowRoleModal(false); setUserToEdit(null); setNewRole(""); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">Change role for <span className="font-semibold text-slate-900">{userToEdit.name}</span></p>
              <div className="space-y-3">
                {[
                  { role: "admin", desc: "Full access to all features and settings" },
                  { role: "hr", desc: "Access to HR features, jobs, applications, clients, vendors, contacts" },
                  { role: "recruiter", desc: "View-only jobs access, plus applications, candidates, and bench" },
                  { role: "sales", desc: "Can create/edit jobs, plus applications, candidates, and bench" },
                  { role: "user", desc: "Basic user access to dashboard and profile" },
                ].map(({ role, desc }) => (
                  <label key={role} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${newRole === role ? "border-[var(--hz-cobalt)] bg-[var(--hz-cobalt-100)]" : "border-slate-200 hover:border-slate-300"}`}>
                    <input type="radio" name="role" value={role} checked={newRole === role} onChange={e => setNewRole(e.target.value)} className="w-4 h-4 text-[var(--hz-cobalt)] focus:ring-[var(--hz-cobalt)]" />
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{role}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button onClick={() => { setShowRoleModal(false); setUserToEdit(null); setNewRole(""); }} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleUpdateRole} disabled={updating || newRole === userToEdit.role} className="px-5 py-2 text-sm font-medium bg-[var(--hz-cobalt)] text-white rounded-lg hover:bg-[var(--hz-cobalt-600)] transition-colors disabled:opacity-50 flex items-center gap-2">
                {updating && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-rose-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete User</h2>
              <p className="text-sm text-slate-500">Are you sure? This action cannot be undone.</p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDeleteUser} disabled={updating} className="px-5 py-2.5 text-sm font-medium bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {updating && <Loader2 className="w-4 h-4 animate-spin" />} Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
