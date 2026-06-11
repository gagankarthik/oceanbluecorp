"use client";

import { PageHeader } from "@/components/admin/page-header";
import { useState, useEffect, useRef } from "react";
import {
  User,
  Bell,
  Shield,
  Globe,
  Save,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Link2,
  Camera,
  Server,
  Lock,
  AlertCircle,
  Building2,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

const tabs = [
  {
    id: "profile",
    name: "Profile",
    icon: User,
    description: "Your personal information",
    adminOnly: false,
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: Bell,
    description: "Alert preferences",
    adminOnly: false,
  },
  {
    id: "security",
    name: "Security",
    icon: Shield,
    description: "Password & access",
    adminOnly: false,
  },
  {
    id: "site",
    name: "System",
    icon: Globe,
    description: "Site configuration",
    adminOnly: true,
  },
];

function InputField({
  label,
  id,
  type = "text",
  value,
  onChange,
  disabled,
  placeholder,
  hint,
  icon: Icon,
}: {
  label: string;
  id: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
            Icon ? "pl-9" : ""
          } ${
            disabled
              ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-white border-slate-300 text-slate-900 focus:border-[var(--hz-cobalt)] focus:ring-2 focus:ring-[rgba(29,78,216,0.2)]"
          }`}
        />
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
  });

  // Profile photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoVersion, setPhotoVersion] = useState(0); // cache-buster after upload
  const [photoFailed, setPhotoFailed] = useState(false); // no photo / load error → initials
  const [hasPhoto, setHasPhoto] = useState(false); // a photo actually loaded
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [notifications, setNotifications] = useState({
    newApplications: true,
    applicationStatusUpdates: true,
    weeklyReports: false,
    marketingEmails: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // If the active tab is admin-only and this user isn't an admin (e.g. role
  // resolved after mount), fall back to Profile.
  useEffect(() => {
    if (!isAdmin && tabs.find((t) => t.id === activeTab)?.adminOnly) {
      setActiveTab("profile");
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (user) {
      const nameParts = (user.name || "").trim().split(" ");
      setProfileForm({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const name = `${profileForm.firstName} ${profileForm.lastName}`.trim();
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, name, phone: profileForm.phone }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !user?.id) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setSaveError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSaveError("Image too large. Maximum size is 2MB.");
      return;
    }

    setSaveError(null);
    setUploadingPhoto(true);
    try {
      const response = await fetch(`/api/users/avatar?userId=${encodeURIComponent(user.id)}`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload photo");
      setPhotoFailed(false);
      setHasPhoto(true);
      setPhotoVersion(Date.now()); // bust the <img> cache so the new photo shows
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;
    setSaveError(null);
    setUploadingPhoto(true);
    try {
      const response = await fetch(`/api/users/avatar/${encodeURIComponent(user.id)}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove photo");
      }
      setHasPhoto(false);
      setPhotoFailed(true);
      setPhotoVersion(Date.now());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveError("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setSaveError("Password must be at least 8 characters");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    setSaveError(null);
    if (activeTab === "profile") handleSaveProfile();
    else if (activeTab === "security") handleSavePassword();
    else {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2500);
      }, 500);
    }
  };

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();

  const roleColors: Record<string, string> = {
    admin: "bg-rose-100 text-rose-800 border-rose-200",
    hr: "bg-violet-100 text-violet-800 border-violet-200",
    recruiter: "bg-teal-100 text-teal-800 border-teal-200",
    sales: "bg-amber-100 text-amber-800 border-amber-200",
    user: "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] border-[var(--hz-cobalt-100)]",
  };
  const roleColor = roleColors[profileForm.role] || roleColors.user;

  // Role-specific header styling
  const roleHeaderConfig: Record<string, { gradient: string; bgGradient: string; border: string; label: string }> = {
    admin: {
      gradient: "from-rose-500 to-pink-600",
      bgGradient: "from-rose-50 to-pink-50",
      border: "border-rose-200",
      label: "Administrator",
    },
    hr: {
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-50 to-purple-50",
      border: "border-violet-200",
      label: "HR Manager",
    },
    recruiter: {
      gradient: "from-teal-500 to-cyan-600",
      bgGradient: "from-teal-50 to-cyan-50",
      border: "border-teal-200",
      label: "Recruiter",
    },
    sales: {
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50",
      border: "border-amber-200",
      label: "Sales",
    },
    user: {
      gradient: "from-[var(--hz-cobalt)] to-cyan-600",
      bgGradient: "from-[var(--hz-cobalt-100)] to-cyan-50",
      border: "border-[var(--hz-cobalt-100)]",
      label: "User",
    },
  };
  const currentRoleHeader = roleHeaderConfig[profileForm.role] || roleHeaderConfig.user;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page header */}
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences"
        meta={
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${roleColor}`}>
            {currentRoleHeader.label}
          </span>
        }
      />

      {/* Error banner */}
      {saveError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[236px_1fr]">
        {/* Section rail */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSaveError(null); }}
                  className={`group flex w-full flex-none items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    active
                      ? "border-[var(--hz-cobalt-100)] bg-[#eef3fe]"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg transition-colors ${
                    active ? "bg-[var(--hz-cobalt)] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  }`}>
                    <tab.icon className="h-4 w-4" />
                  </span>
                  <span className="hidden min-w-0 sm:block lg:block">
                    <span className={`block text-sm font-semibold ${active ? "text-[var(--hz-cobalt)]" : "text-slate-700"}`}>{tab.name}</span>
                    <span className="block text-[11px] leading-snug text-slate-400">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content panel */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <div className="p-6 space-y-6">
            {/* Avatar + info row */}
            <div className={`flex items-center gap-5 p-4 rounded-xl border ${
              profileForm.role === "admin" ? "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100" :
              profileForm.role === "hr" ? "bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100" :
              profileForm.role === "recruiter" ? "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-100" :
              profileForm.role === "sales" ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100" :
              "bg-gradient-to-r from-[var(--hz-cobalt-100)] to-cyan-50 border-[var(--hz-cobalt-100)]"
            }`}>
              <div className="relative flex-shrink-0">
                <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-bold shadow-md ${
                  profileForm.role === "admin" ? "bg-gradient-to-br from-rose-500 to-pink-600" :
                  profileForm.role === "hr" ? "bg-gradient-to-br from-violet-500 to-purple-600" :
                  profileForm.role === "recruiter" ? "bg-gradient-to-br from-teal-500 to-cyan-600" :
                  profileForm.role === "sales" ? "bg-gradient-to-br from-amber-500 to-orange-600" :
                  "bg-gradient-to-br from-[var(--hz-cobalt)] to-cyan-600"
                }`}>
                  {user?.id && !photoFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/users/avatar/${user.id}?v=${photoVersion}`}
                      alt={user?.name || "Profile photo"}
                      className="h-full w-full object-cover"
                      onLoad={() => setHasPhoto(true)}
                      onError={() => { setHasPhoto(false); setPhotoFailed(true); }}
                    />
                  ) : (
                    userInitials
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  aria-label="Change profile photo"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[var(--hz-cobalt)] text-white shadow-sm transition-colors hover:bg-[var(--hz-cobalt-600)] disabled:opacity-60"
                >
                  {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-lg truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${roleColor}`}>
                  {profileForm.role}
                </span>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="text-xs font-semibold text-[var(--hz-cobalt)] hover:underline disabled:opacity-50"
                  >
                    {hasPhoto ? "Change photo" : "Upload photo"}
                  </button>
                  {hasPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="text-xs font-medium text-slate-400 transition-colors hover:text-rose-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                  <span className="text-[11px] text-slate-400">JPG, PNG or WebP · max 2MB</span>
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="First Name"
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  placeholder="John"
                  icon={User}
                />
                <InputField
                  label="Last Name"
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  placeholder="Doe"
                />
                <InputField
                  label="Email Address"
                  id="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  icon={Mail}
                  hint="Email is managed by your administrator and cannot be changed here."
                />
                <InputField
                  label="Phone Number"
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  icon={Phone}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                Account Details
              </h3>
              <InputField
                label="Role"
                id="role"
                value={profileForm.role}
                disabled
                icon={Shield}
                hint="Your role is assigned by an administrator."
              />
            </div>
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === "notifications" && (
          <div className="p-6 space-y-2">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">Notification Preferences</h2>
              <p className="text-sm text-slate-500 mt-0.5">Choose what you want to be notified about.</p>
            </div>

            {[
              {
                key: "newApplications" as const,
                title: "New Applications",
                description: "Get notified when a candidate submits a new application",
                icon: User,
                color: "text-[var(--hz-cobalt)] bg-[var(--hz-cobalt-100)]",
              },
              {
                key: "applicationStatusUpdates" as const,
                title: "Application Status Updates",
                description: "Notifications when an application status changes",
                icon: Bell,
                color: "text-purple-600 bg-purple-50",
              },
              {
                key: "weeklyReports" as const,
                title: "Weekly Reports",
                description: "Receive a weekly summary of site and pipeline activity",
                icon: Server,
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                key: "marketingEmails" as const,
                title: "Marketing & Updates",
                description: "Receive news about new features and platform updates",
                icon: Mail,
                color: "text-amber-600 bg-amber-50",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) =>
                      setNotifications({ ...notifications, [item.key]: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-[var(--hz-cobalt)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--hz-cobalt)]" />
                </label>
              </div>
            ))}
          </div>
        )}

        {/* ── Security Tab ── */}
        {activeTab === "security" && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
              <p className="text-sm text-slate-500 mt-0.5">Update your account password below.</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
              </p>
            </div>

            <div className="space-y-4 max-w-md">
              {[
                { label: "Current Password", key: "currentPassword" as const, show: showCurrentPassword, toggle: () => setShowCurrentPassword(!showCurrentPassword) },
                { label: "New Password", key: "newPassword" as const, show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword) },
                { label: "Confirm New Password", key: "confirmPassword" as const, show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword) },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type={field.show ? "text" : "password"}
                      value={passwordForm[field.key]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pl-9 pr-10 text-sm text-slate-900 outline-none focus:border-[var(--hz-cobalt)] focus:ring-2 focus:ring-[rgba(29,78,216,0.2)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={field.toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── System / Site Tab ── */}
        {activeTab === "site" && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">System Information</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Read-only site configuration.
              </p>
            </div>

            {/* Site info grid */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Site Details
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { label: "Site Name", value: "Ocean Blue Corporation", icon: Building2 },
                  { label: "Contact Email", value: "hr@oceanbluecorp.com", icon: Mail },
                  { label: "Phone Number", value: "+1 614-844-6925", icon: Phone },
                  { label: "Address", value: "Powell, OH 43065", icon: MapPin },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-medium text-slate-800 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social links */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Social Links
              </h3>
              <div className="space-y-2">
                {[
                  { label: "LinkedIn", value: "https://linkedin.com/company/oceanbluecorp", icon: Linkedin, color: "text-[var(--hz-cobalt)]" },
                  { label: "Twitter", value: "https://twitter.com/oceanbluecorp", icon: Twitter, color: "text-sky-500" },
                  { label: "Website", value: "https://oceanbluecorp.com", icon: Link2, color: "text-slate-600" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer — save */}
        {activeTab !== "site" && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            {showSaved && <span className="text-xs font-medium text-emerald-600">All changes saved</span>}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
                showSaved
                  ? "bg-emerald-600 text-white"
                  : "bg-[var(--hz-cobalt)] text-white hover:bg-[var(--hz-cobalt-600)] disabled:opacity-50"
              }`}
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
              ) : showSaved ? (
                <><Check className="w-4 h-4" />Saved!</>
              ) : (
                <><Save className="w-4 h-4" />Save Changes</>
              )}
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
