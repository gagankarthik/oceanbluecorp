"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Loader2, Twitter, Linkedin } from "lucide-react";
import {
  IconUser, IconBell, IconShield, IconGlobe, IconSave, IconEye, IconEyeOff,
  IconMail, IconPhone, IconLocation, IconLink, IconCamera, IconLock, IconAlert,
  IconBuilding, IconSettings, IconIdCard,
} from "@/components/admin/icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { Avatar } from "@/components/admin/avatar";
import { StatusBadge } from "@/components/admin/status-badge";
import { Field, FormInput } from "@/components/admin/forms/primitives";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tone } from "@/components/admin/theme";

const tabs = [
  {
    id: "profile",
    name: "Profile",
    icon: IconUser,
    description: "Your personal information",
    adminOnly: false,
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: IconBell,
    description: "Alert preferences",
    adminOnly: false,
  },
  {
    id: "security",
    name: "Security",
    icon: IconShield,
    description: "Password & access",
    adminOnly: false,
  },
  {
    id: "site",
    name: "System",
    icon: IconGlobe,
    description: "Site configuration",
    adminOnly: true,
  },
];

/**
 * Role presentation for the header chip. Replaces the two parallel gradient
 * tables (`roleColors` + `roleHeaderConfig`) that had to be kept in sync by
 * hand; a role is a category chip, not a decorated banner.
 */
const ROLE_CHIP: Record<string, { label: string; tone: Tone }> = {
  admin:     { label: "Administrator", tone: "rose"   },
  hr:        { label: "HR Manager",    tone: "violet" },
  recruiter: { label: "Recruiter",     tone: "teal"   },
  sales:     { label: "Sales",         tone: "amber"  },
};
const DEFAULT_ROLE_CHIP = { label: "User", tone: "slate" as Tone };

/** ui/Checkbox defaults to the navy --primary; nudge it to the cobalt accent. */
const checkboxAccent =
  "border-[var(--adm-line)] data-[state=checked]:border-[var(--adm-accent)] data-[state=checked]:bg-[var(--adm-accent)]";

const NOTIFICATION_ROWS = [
  {
    key: "newApplications" as const,
    title: "New applications",
    description: "Get notified when a candidate submits a new application",
  },
  {
    key: "applicationStatusUpdates" as const,
    title: "Application status updates",
    description: "Notifications when an application status changes",
  },
  {
    key: "weeklyReports" as const,
    title: "Weekly reports",
    description: "Receive a weekly summary of site and pipeline activity",
  },
  {
    key: "marketingEmails" as const,
    title: "Marketing & updates",
    description: "Receive news about new features and platform updates",
  },
];

const SITE_DETAILS = [
  { label: "Site name",     value: "Ocean Blue Corporation", icon: IconBuilding },
  { label: "Contact email", value: "hr@oceanbluecorp.com",   icon: IconMail },
  { label: "Phone number",  value: "+1 614-844-6925",        icon: IconPhone },
  { label: "Address",       value: "Powell, OH 43065",       icon: IconLocation },
];

const SOCIAL_LINKS = [
  { label: "LinkedIn", value: "https://linkedin.com/company/oceanbluecorp", icon: Linkedin },
  { label: "Twitter",  value: "https://twitter.com/oceanbluecorp",          icon: Twitter },
  { label: "Website",  value: "https://oceanbluecorp.com",                  icon: IconLink },
];

/** Read-only record row: label rail on the left, value on the right. */
function RecordRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 border-b border-[var(--adm-line-soft)] px-5 py-3 last:border-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="flex items-center gap-2 text-[13px] text-[var(--adm-ink-subtle)]">
        <Icon className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
        {label}
      </span>
      <span className="truncate text-[14px] font-medium text-[var(--adm-ink)]">{value || "–"}</span>
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

  const roleChip = ROLE_CHIP[profileForm.role] || DEFAULT_ROLE_CHIP;

  const passwordFields = [
    { label: "Current password",     id: "currentPassword", key: "currentPassword" as const, ac: "current-password", show: showCurrentPassword, toggle: () => setShowCurrentPassword(!showCurrentPassword) },
    { label: "New password",         id: "newPassword",     key: "newPassword" as const,     ac: "new-password",     show: showNewPassword,     toggle: () => setShowNewPassword(!showNewPassword) },
    { label: "Confirm new password", id: "confirmPassword", key: "confirmPassword" as const, ac: "new-password",     show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword) },
  ];

  return (
    <div className="space-y-5 pb-10">

      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences"
        icon={IconSettings}
        meta={<StatusBadge tone={roleChip.tone} label={roleChip.label} size="md" />}
      />

      {saveError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[6px] border border-rose-200 bg-[var(--adm-danger-soft)] px-4 py-3 text-[13px] text-[var(--adm-danger)]"
        >
          <IconAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      <div className="grid max-w-5xl gap-4 lg:grid-cols-[212px_minmax(0,1fr)]">

        {/* ── section rail ── */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav
            aria-label="Settings sections"
            className="flex gap-1 overflow-x-auto rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1.5 lg:flex-col lg:overflow-visible"
          >
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSaveError(null); }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-none items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-left transition-colors lg:w-full",
                    active
                      ? "bg-[var(--adm-accent-tint)] text-[var(--adm-accent)] shadow-[inset_2px_0_0_var(--adm-accent)]"
                      : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  <tab.icon className={cn("h-4 w-4 flex-none", active ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")} strokeWidth={1.75} />
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap text-[13.5px] font-semibold">{tab.name}</span>
                    <span className="hidden text-[11.5px] leading-snug text-[var(--adm-ink-subtle)] lg:block">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── section panels ── */}
        <div className="space-y-4">

          {/* ── Profile ── */}
          {activeTab === "profile" && (
            <>
              <AdminCard>
                <AdminCardHeader icon={IconCamera} title="Profile photo" />
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <div className="relative flex-shrink-0">
                    {user?.id && !photoFailed ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/users/avatar/${user.id}?v=${photoVersion}`}
                        alt={user?.name || "Profile photo"}
                        width={96}
                        height={96}
                        loading="lazy"
                        decoding="async"
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-[var(--adm-surface)] shadow-sm"
                        onLoad={() => setHasPhoto(true)}
                        onError={() => { setHasPhoto(false); setPhotoFailed(true); }}
                      />
                    ) : (
                      <Avatar name={user?.name} email={user?.email} size="xl" />
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      aria-label="Change profile photo"
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--adm-surface)] bg-[var(--adm-accent)] text-white transition-colors hover:bg-[var(--adm-accent-strong)] disabled:opacity-60"
                    >
                      {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <IconCamera className="h-3.5 w-3.5" />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-[var(--adm-ink)]">{user?.name || user?.email || "–"}</p>
                    <p className="truncate text-[13px] text-[var(--adm-ink-subtle)]">{user?.email || "–"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="text-xs font-semibold text-[var(--adm-accent)] transition-colors hover:text-[var(--adm-accent-strong)] disabled:opacity-50"
                      >
                        {hasPhoto ? "Change photo" : "Upload photo"}
                      </button>
                      {hasPhoto && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={uploadingPhoto}
                          className="text-xs font-medium text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-danger)] disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                      <span className="text-[11px] text-[var(--adm-ink-subtle)]">JPG, PNG or WebP · max 2MB</span>
                    </div>
                  </div>
                </div>
              </AdminCard>

              <AdminCard>
                <AdminCardHeader icon={IconUser} title="Personal information" />
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <Field label="First name" htmlFor="firstName">
                    <FormInput
                      id="firstName"
                      autoComplete="given-name"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </Field>
                  <Field label="Last name" htmlFor="lastName">
                    <FormInput
                      id="lastName"
                      autoComplete="family-name"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </Field>
                  <Field
                    label="Email address"
                    htmlFor="email"
                    helper="Email is managed by your administrator and cannot be changed here."
                  >
                    <FormInput id="email" type="email" autoComplete="email" value={profileForm.email} readOnly disabled />
                  </Field>
                  <Field label="Phone number" htmlFor="phone">
                    <FormInput
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </Field>
                </div>
              </AdminCard>

              <AdminCard>
                <AdminCardHeader icon={IconIdCard} title="Account details" />
                <div className="p-5 sm:max-w-sm">
                  <Field label="Role" htmlFor="role" helper="Your role is assigned by an administrator.">
                    <FormInput id="role" value={profileForm.role} readOnly disabled className="capitalize" />
                  </Field>
                </div>
              </AdminCard>
            </>
          )}

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <AdminCard>
              <AdminCardHeader icon={IconBell} title="Notification preferences" />
              <div>
                {NOTIFICATION_ROWS.map((item) => {
                  const labelId = `notify-${item.key}-label`;
                  return (
                    <div
                      key={item.key}
                      className="flex items-start gap-3 border-b border-[var(--adm-line-soft)] px-5 py-3.5 last:border-0"
                    >
                      <Checkbox
                        className={cn("mt-0.5", checkboxAccent)}
                        checked={notifications[item.key]}
                        onCheckedChange={(v) =>
                          setNotifications({ ...notifications, [item.key]: v === true })
                        }
                        aria-labelledby={labelId}
                      />
                      <div className="min-w-0">
                        <p id={labelId} className="text-[14px] font-medium text-[var(--adm-ink)]">{item.title}</p>
                        <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--adm-ink-subtle)]">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminCard>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <AdminCard>
              <AdminCardHeader icon={IconLock} title="Change password" />
              <div className="space-y-4 p-5">
                <div className="flex items-start gap-2.5 rounded-[6px] border border-amber-200 bg-[var(--adm-warning-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--adm-warning)]">
                  <IconAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
                </div>

                <div className="space-y-4 sm:max-w-md">
                  {passwordFields.map((field) => (
                    <Field key={field.key} label={field.label} htmlFor={field.id}>
                      <div className="relative">
                        <FormInput
                          id={field.id}
                          type={field.show ? "text" : "password"}
                          autoComplete={field.ac}
                          value={passwordForm[field.key]}
                          onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={field.toggle}
                          aria-label={`${field.show ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-ink-mute)]"
                        >
                          {field.show
                            ? <IconEyeOff className="h-4 w-4" aria-hidden="true" />
                            : <IconEye className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </Field>
                  ))}
                </div>
              </div>
            </AdminCard>
          )}

          {/* ── System (admin only) ── */}
          {activeTab === "site" && isAdmin && (
            <>
              <AdminCard>
                <AdminCardHeader
                  icon={IconGlobe}
                  title="Site details"
                  action={
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--adm-ink-subtle)]">
                      Read-only
                    </span>
                  }
                />
                <div>
                  {SITE_DETAILS.map((item) => (
                    <RecordRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </div>
              </AdminCard>

              <AdminCard>
                <AdminCardHeader icon={IconLink} title="Social links" />
                <div>
                  {SOCIAL_LINKS.map((item) => (
                    <RecordRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </div>
              </AdminCard>
            </>
          )}

          {/* ── command bar ── */}
          {activeTab !== "site" && (
            <div className="flex items-center justify-end gap-3 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-5 py-3.5">
              {showSaved && <span className="text-[12.5px] font-semibold text-[var(--adm-success)]">All changes saved</span>}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-[8px] px-4 text-[14px] font-semibold text-white transition-colors",
                  showSaved
                    ? "bg-emerald-600"
                    : "bg-[var(--adm-accent)] hover:bg-[var(--adm-accent-strong)] disabled:opacity-50",
                )}
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                ) : showSaved ? (
                  <><Check className="h-4 w-4" />Saved</>
                ) : (
                  <><IconSave className="h-4 w-4" />Save changes</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
