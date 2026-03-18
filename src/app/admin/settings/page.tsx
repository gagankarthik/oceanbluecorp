"use client";

import { useState, useEffect } from "react";
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
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: Bell,
    description: "Alert preferences",
  },
  {
    id: "security",
    name: "Security",
    icon: Shield,
    description: "Password & access",
  },
  {
    id: "site",
    name: "System",
    icon: Globe,
    description: "Site configuration",
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
  icon?: React.ElementType;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
              ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          }`}
        />
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) {
      const nameParts = (user.name || "").trim().split(" ");
      setProfileForm({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "user",
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
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    hr: "bg-blue-100 text-blue-800 border-blue-200",
    user: "bg-gray-100 text-gray-700 border-gray-200",
  };
  const roleColor = roleColors[profileForm.role] || roleColors.user;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account and site preferences</p>
        </div>
        {activeTab !== "site" && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
              showSaved
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
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
        )}
      </div>

      {/* Error banner */}
      {saveError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSaveError(null); }}
                className={`flex items-center gap-2.5 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  active
                    ? "border-blue-600 text-blue-600 bg-blue-50/40"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-400"}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <div className="p-6 space-y-6">
            {/* Avatar + info row */}
            <div className="flex items-center gap-5 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-lg truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${roleColor}`}>
                  {profileForm.role}
                </span>
              </div>
            </div>

            {/* Form fields */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
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

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
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
              <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>
              <p className="text-sm text-gray-500 mt-0.5">Choose what you want to be notified about.</p>
            </div>

            {[
              {
                key: "newApplications" as const,
                title: "New Applications",
                description: "Get notified when a candidate submits a new application",
                icon: User,
                color: "text-blue-600 bg-blue-50",
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
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
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
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            ))}
          </div>
        )}

        {/* ── Security Tab ── */}
        {activeTab === "security" && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500 mt-0.5">Update your Cognito account password below.</p>
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
                  <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type={field.show ? "text" : "password"}
                      value={passwordForm[field.key]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-9 pr-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={field.toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <h2 className="text-base font-semibold text-gray-900">System Information</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Read-only site configuration — managed via environment variables and AWS console.
              </p>
            </div>

            {/* Site info grid */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Site Details
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { label: "Site Name", value: "Ocean Blue Corporation", icon: Building2 },
                  { label: "Contact Email", value: "hr@oceanbluecorp.com", icon: Mail },
                  { label: "Phone Number", value: "+1 614-844-6925", icon: Phone },
                  { label: "Address", value: "Powell, OH 43065", icon: MapPin },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AWS config */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                AWS Configuration
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { label: "Region", value: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2", icon: Server },
                  { label: "User Pool ID", value: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "—", icon: Shield },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate font-mono">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social links */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Social Links
              </h3>
              <div className="space-y-2">
                {[
                  { label: "LinkedIn", value: "https://linkedin.com/company/oceanbluecorp", icon: Linkedin, color: "text-blue-700" },
                  { label: "Twitter", value: "https://twitter.com/oceanbluecorp", icon: Twitter, color: "text-sky-500" },
                  { label: "Website", value: "https://oceanbluecorp.com", icon: Link2, color: "text-gray-600" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm font-medium text-gray-700 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
