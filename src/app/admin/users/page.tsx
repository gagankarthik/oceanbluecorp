"use client";

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
  Filter,
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
  role: "admin" | "hr" | "user";
  status: "active" | "inactive" | "pending";
  groups: string[];
  createdAt: string;
  lastModified?: string;
  enabled: boolean;
}

const roleConfig: Record<string, { label: string; bg: string }> = {
  admin: { label: "Admin", bg: "bg-rose-100 text-rose-800" },
  hr: { label: "HR", bg: "bg-purple-100 text-purple-800" },
  user: { label: "User", bg: "bg-blue-100 text-blue-800" },
};

const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
  active: { label: "Active", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  inactive: { label: "Inactive", bg: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  pending: { label: "Pending", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
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
      setUsers(prev => prev.map(u => u.id === userToEdit.id ? { ...u, role: newRole as "admin" | "hr" | "user" } : u));
      setShowRoleModal(false);
      setUserToEdit(null);
      setNewRole("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
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
      alert(err instanceof Error ? err.message : "Failed to delete user");
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
      alert(err instanceof Error ? err.message : "Failed to update status");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">{users.length}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Manage user accounts, roles, and permissions</p>
        </div>
        <button onClick={fetchUsers} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
          { label: "Active", value: stats.active, icon: UserCheck, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Admins", value: stats.admins, icon: Shield, color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
          { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        {/* Filter bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-all ${showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              <Filter className="w-4 h-4" /> Filters
              {(selectedRole !== "all" || selectedStatus !== "all") && <span className="w-2 h-2 rounded-full bg-blue-500" />}
            </button>
          </div>
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="hr">HR</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              {(selectedRole !== "all" || selectedStatus !== "all") && (
                <button onClick={() => { setSelectedRole("all"); setSelectedStatus("all"); }} className="self-end text-sm text-blue-600 hover:text-blue-700 font-medium">Clear filters</button>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
            <p className="text-gray-500 text-sm">Loading users...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">Error loading users</h3>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button onClick={fetchUsers} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Try Again</button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-3 px-4 text-left">
                      <input type="checkbox" checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Joined</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map(user => {
                    const roleCfg = roleConfig[user.role] || roleConfig.user;
                    const statusCfg = statusConfig[user.status] || statusConfig.pending;
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${selectedUsers.includes(user.id) ? "bg-blue-50/50" : ""}`}>
                        <td className="py-3.5 px-4">
                          <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleUserSelection(user.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {getInitials(user.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-400 lg:hidden">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 hidden lg:table-cell">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-xs text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" />{user.email}</div>
                            {user.phone && <div className="flex items-center gap-2 text-xs text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" />{user.phone}</div>}
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
                          <span className="text-xs text-gray-500">{formatDate(user.createdAt)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end">
                            <button onClick={() => { setUserToDelete(user.id); setShowDeleteModal(true); }} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No users found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
              </div>
            )}

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Change User Role</h2>
              <button onClick={() => { setShowRoleModal(false); setUserToEdit(null); setNewRole(""); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Change role for <span className="font-semibold text-gray-900">{userToEdit.name}</span></p>
              <div className="space-y-3">
                {[
                  { role: "admin", desc: "Full access to all features and settings" },
                  { role: "hr", desc: "Access to HR features, jobs, and applications" },
                  { role: "user", desc: "Basic user access to dashboard and profile" },
                ].map(({ role, desc }) => (
                  <label key={role} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${newRole === role ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="role" value={role} checked={newRole === role} onChange={e => setNewRole(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{role}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setShowRoleModal(false); setUserToEdit(null); setNewRole(""); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleUpdateRole} disabled={updating || newRole === userToEdit.role} className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete User</h2>
              <p className="text-sm text-gray-500">Are you sure? This action cannot be undone.</p>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
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
