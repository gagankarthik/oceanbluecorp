"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Loader2, Twitter, Linkedin } from "lucide-react";
import {
  IconUser, IconBell, IconShield, IconGlobe, IconSave, IconEye, IconEyeOff,
  IconMail, IconPhone, IconLocation, IconLink, IconCamera, IconAlert,
  IconBuilding, IconInfo,
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
import { WorkspaceButton, NotePanel } from "@/components/admin/workspace";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormErrorBanner } from "@/components/admin/forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, maxLen, phone, required, strongPassword, LIMITS } from "@/lib/form-validation";

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

/** Role chip in the header. Categorical, so neutral except admin. */
const ROLE_CHIP: Record<string, { label: string; tone: Tone }> = {
  admin:     { label: "Administrator", tone: "blue"  },
  hr:        { label: "HR manager",    tone: "slate" },
  recruiter: { label: "Recruiter",     tone: "slate" },
  sales:     { label: "Sales",         tone: "slate" },
  media:     { label: "Media",         tone: "slate" },
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
    <div className="grid gap-1 border-b border-[var(--adm-line-soft)] px-4 py-2.5 last:border-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="flex items-center gap-2 text-[13px] text-[var(--adm-ink-mute)]">
        <Icon className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
        {label}
      </span>
      <span className="truncate text-[13.5px] font-medium text-[var(--adm-ink)]">{value || "–"}</span>
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
  // Field errors only the server can know (a wrong current password). Cleared
  // when that field is edited, so a blur re-check doesn't wipe them first.
  const [passwordServerErrors, setPasswordServerErrors] =
    useState<Partial<Record<"currentPassword" | "newPassword", string>>>({});

  const profileCheck = useFormErrors(() =>
    collectErrors({
      firstName: check(profileForm.firstName, required("Enter your first name."), maxLen(LIMITS.name)),
      lastName: check(profileForm.lastName, maxLen(LIMITS.name)),
      phone: check(profileForm.phone, phone()),
    }),
  );

  const passwordCheck = useFormErrors(() =>
    collectErrors({
      currentPassword:
        check(passwordForm.currentPassword, required("Enter your current password.")) ??
        passwordServerErrors.currentPassword,
      newPassword:
        check(passwordForm.newPassword, required("Choose a new password."), strongPassword()) ??
        (passwordForm.newPassword === passwordForm.currentPassword
          ? "Choose a password different from your current one."
          : passwordServerErrors.newPassword),
      confirmPassword:
        check(passwordForm.confirmPassword, required("Re-enter the new password to confirm it.")) ??
        (passwordForm.confirmPassword !== passwordForm.newPassword
          ? "This doesn’t match the new password you entered above."
          : undefined),
    }),
  );

  // Maintenance mode: the "site" content block, read by the root layout and revalidated on save.
  const [maint, setMaint] = useState({ enabled: false, message: "", eta: "" });
  const [maintLoaded, setMaintLoaded] = useState(false);
  const [maintSaving, setMaintSaving] = useState(false);
  const [maintSaved, setMaintSaved] = useState(false);
  const [maintError, setMaintError] = useState<string | null>(null);
  const [confirmOffline, setConfirmOffline] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/content")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const blocks = d.blocks as { id: string; fields: Record<string, string> }[] | undefined;
        const site = blocks?.find((b) => b.id === "site");
        if (site?.fields) {
          setMaint({
            enabled: site.fields.maintenance === "true",
            message: site.fields.maintenanceMessage || "",
            eta: site.fields.maintenanceEta || "",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load maintenance setting:", err);
        setMaintError("Couldn't load the current maintenance setting. Refresh before changing it.");
      })
      .finally(() => setMaintLoaded(true));
  }, [isAdmin]);

  const saveMaintenance = async (next: { enabled: boolean; message: string; eta: string }) => {
    setMaintSaving(true);
    setMaintError(null);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "site",
          fields: {
            maintenance: next.enabled ? "true" : "false",
            maintenanceMessage: next.message,
            maintenanceEta: next.eta,
          },
          updatedBy: user?.email,
          updatedByName: user?.name,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not save.");
      }
      setMaint(next);
      setMaintSaved(true);
      setTimeout(() => setMaintSaved(false), 2500);
    } catch (err) {
      setMaintError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setMaintSaving(false);
    }
  };

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
    if (!profileCheck.validateAll()) return;
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
        throw new Error(data.error || "Your profile could not be saved. Try again in a moment.");
      }
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Your profile could not be saved. Try again in a moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !user?.id) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setSaveError("Choose a JPG, PNG or WebP image for your photo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSaveError("That image is larger than 2 MB. Choose a smaller one.");
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
    if (!passwordCheck.validateAll()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "Your password could not be changed. Try again in a moment.";
        // Wrong current password, or a policy miss: say it next to the field.
        if (data.field === "currentPassword" || data.field === "newPassword") {
          const field: "currentPassword" | "newPassword" = data.field;
          setPasswordServerErrors({ [field]: message });
          passwordCheck.setErrors((prev) => ({ ...prev, [field]: message }));
          document.getElementById(field)?.focus();
          return;
        }
        throw new Error(message);
      }
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordServerErrors({});
      passwordCheck.reset();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Your password could not be changed. Try again in a moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (isSaving) return;
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
    <div className="space-y-4 pb-10 lg:space-y-5">
      <PageHeader
        title="Settings"
        info="Your profile, alerts, password and, for admins, site settings."
        meta={<StatusBadge tone={roleChip.tone} label={roleChip.label} size="md" />}
      />

      <FormErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />

      <div className="grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-5">

        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <nav
            aria-label="Settings sections"
            className="flex gap-1 overflow-x-auto rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1.5 shadow-[var(--adm-shadow-sm)] lg:flex-col lg:overflow-visible"
          >
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id); setSaveError(null); profileCheck.reset(); passwordCheck.reset(); }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-none items-center gap-2.5 rounded-[8px] px-3 py-2 text-left transition-colors duration-150 lg:w-full lg:items-start lg:py-2.5",
                    active
                      ? "bg-[var(--adm-accent-tint)] text-[var(--adm-accent)]"
                      : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  <tab.icon className={cn("h-4 w-4 flex-none lg:mt-0.5", active ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")} strokeWidth={1.75} />
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap text-[13.5px] font-medium">{tab.name}</span>
                    <span className="hidden text-[12.5px] leading-snug text-[var(--adm-ink-subtle)] lg:block">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Blur bubbles; each check only re-runs once its form was submitted. */}
        <div className="min-w-0 space-y-4" onBlur={() => { profileCheck.revalidate(); passwordCheck.revalidate(); }}>

          {activeTab === "profile" && (
            <>
              <AdminCard>
                <AdminCardHeader title="Profile photo" />
                <div className="flex flex-wrap items-center gap-4 p-4">
                  <div className="relative flex-none">
                    <Avatar
                      name={user?.name}
                      email={user?.email}
                      size="xl"
                      src={user?.id && !photoFailed ? `/api/users/avatar/${user.id}?v=${photoVersion}` : null}
                      onLoad={() => setHasPhoto(true)}
                      onError={() => { setHasPhoto(false); setPhotoFailed(true); }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      aria-label="Change profile photo"
                      className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)] shadow-[var(--adm-shadow-sm)] transition-colors duration-150 hover:border-[var(--adm-line-strong)] hover:text-[var(--adm-ink)] disabled:opacity-60"
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
                    <p className="truncate text-[13px] text-[var(--adm-ink-mute)]">{user?.email || "–"}</p>
                    <p className="mt-1 text-[12.5px] text-[var(--adm-ink-subtle)]">JPG, PNG or WebP · max 2MB</p>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <WorkspaceButton onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                      <IconCamera />{hasPhoto ? "Change photo" : "Upload photo"}
                    </WorkspaceButton>
                    {hasPhoto && (
                      <WorkspaceButton
                        variant="ghost"
                        onClick={handleRemovePhoto}
                        disabled={uploadingPhoto}
                        className="hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
                      >
                        Remove
                      </WorkspaceButton>
                    )}
                  </div>
                </div>
              </AdminCard>

              <AdminCard>
                <AdminCardHeader title="Personal information" />
                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                  <Field label="First name" required htmlFor="firstName" error={profileCheck.errors.firstName}>
                    <FormInput
                      id="firstName"
                      {...profileCheck.invalidProps("firstName")}
                      autoComplete="given-name"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </Field>
                  <Field label="Last name" htmlFor="lastName" error={profileCheck.errors.lastName}>
                    <FormInput
                      id="lastName"
                      {...profileCheck.invalidProps("lastName")}
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
                  <Field label="Phone number" htmlFor="phone" error={profileCheck.errors.phone}>
                    <FormInput
                      id="phone"
                      {...profileCheck.invalidProps("phone")}
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
                <AdminCardHeader title="Account details" />
                <div className="p-4 sm:max-w-sm">
                  <Field label="Role" htmlFor="role" helper="Your role is assigned by an administrator.">
                    <FormInput id="role" value={profileForm.role} readOnly disabled className="capitalize" />
                  </Field>
                </div>
              </AdminCard>
            </>
          )}

          {activeTab === "notifications" && (
            <AdminCard className="overflow-hidden">
              <AdminCardHeader title="Notification preferences" />
              <div>
                {NOTIFICATION_ROWS.map((item) => {
                  const labelId = `notify-${item.key}-label`;
                  const controlId = `notify-${item.key}`;
                  return (
                    <label
                      key={item.key}
                      htmlFor={controlId}
                      className="flex cursor-pointer items-start gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3 transition-colors duration-150 last:border-0 hover:bg-[var(--adm-row-hover)]"
                    >
                      <Checkbox
                        id={controlId}
                        className={cn("mt-0.5", checkboxAccent)}
                        checked={notifications[item.key]}
                        onCheckedChange={(v) =>
                          setNotifications({ ...notifications, [item.key]: v === true })
                        }
                        aria-labelledby={labelId}
                      />
                      <span className="min-w-0">
                        <span id={labelId} className="block text-[14px] font-medium text-[var(--adm-ink)]">{item.title}</span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-[var(--adm-ink-mute)]">{item.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </AdminCard>
          )}

          {activeTab === "security" && (
            <AdminCard>
              <AdminCardHeader title="Change password" />
              <div className="space-y-4 p-4">
                <NotePanel className="flex items-start gap-2.5">
                  <IconInfo className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
                  Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
                </NotePanel>

                <div className="space-y-4 sm:max-w-md">
                  {passwordFields.map((field) => (
                    <Field key={field.key} label={field.label} required htmlFor={field.id} error={passwordCheck.errors[field.key]}>
                      <div className="relative">
                        <FormInput
                          id={field.id}
                          {...passwordCheck.invalidProps(field.key)}
                          type={field.show ? "text" : "password"}
                          autoComplete={field.ac}
                          value={passwordForm[field.key]}
                          onChange={(e) => {
                            setPasswordForm({ ...passwordForm, [field.key]: e.target.value });
                            if (field.key in passwordServerErrors) setPasswordServerErrors({});
                          }}
                          className="pr-11"
                        />
                        <button
                          type="button"
                          onClick={field.toggle}
                          aria-label={`${field.show ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                          className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
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

          {activeTab === "site" && isAdmin && (
            <>
              <AdminCard>
                <AdminCardHeader
                  title="Maintenance mode"
                  subtitle="Replace the public site with a maintenance screen"
                  action={
                    <StatusBadge
                      tone={maint.enabled ? "rose" : "emerald"}
                      label={maint.enabled ? "Site is offline" : "Site is live"}
                      size="md"
                    />
                  }
                />
                <div className="space-y-4 p-4">
                  <p className="max-w-[68ch] text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">
                    The admin console and sign-in stay reachable, so you can
                    always turn it back off from here.
                  </p>

                  <Field label="Message shown to visitors" hint="Optional. Leave empty for the default wording.">
                    <FormInput
                      value={maint.message}
                      onChange={(e) => setMaint({ ...maint, message: e.target.value })}
                      placeholder="We are upgrading our systems and will be back shortly."
                      disabled={!maintLoaded || maintSaving}
                    />
                  </Field>

                  <Field
                    label="Expected back"
                    helper="Fill this in for planned work. Left empty, the page reads as an unexpected outage instead."
                  >
                    <FormInput
                      value={maint.eta}
                      onChange={(e) => setMaint({ ...maint, eta: e.target.value })}
                      placeholder="by 3:00 PM EST"
                      disabled={!maintLoaded || maintSaving}
                    />
                  </Field>

                  {maintError && (
                    <p role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--adm-danger-ink)]">
                      <IconAlert className="h-4 w-4 flex-none" />{maintError}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--adm-line-soft)] pt-4">
                    {maint.enabled ? (
                      <WorkspaceButton
                        variant="primary"
                        disabled={!maintLoaded || maintSaving}
                        onClick={() => void saveMaintenance({ ...maint, enabled: false })}
                      >
                        {maintSaving ? <><Loader2 className="animate-spin" />Saving…</> : <><Check />Bring the site back online</>}
                      </WorkspaceButton>
                    ) : (
                      // Taking the site down is confirmed; bringing it back is not.
                      <WorkspaceButton
                        disabled={!maintLoaded || maintSaving}
                        onClick={() => setConfirmOffline(true)}
                        className="border-transparent bg-[var(--adm-danger)] text-white hover:border-transparent hover:bg-[var(--adm-danger-ink)]"
                      >
                        {maintSaving ? <><Loader2 className="animate-spin" />Saving…</> : <><IconAlert />Take the site offline</>}
                      </WorkspaceButton>
                    )}

                    {maint.enabled && (
                      <WorkspaceButton disabled={maintSaving} onClick={() => void saveMaintenance(maint)}>
                        <IconSave />Update message
                      </WorkspaceButton>
                    )}

                    <WorkspaceButton variant="ghost" asChild>
                      <a href="/maintenance" target="_blank" rel="noopener noreferrer">
                        Preview what visitors will see
                      </a>
                    </WorkspaceButton>

                    {maintSaved && (
                      <span role="status" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--adm-success-ink)]">
                        <Check className="h-4 w-4" />Saved
                      </span>
                    )}
                  </div>
                </div>
              </AdminCard>

              <ConfirmDialog
                open={confirmOffline}
                title="Take the public site offline?"
                body="Visitors will see the maintenance screen until you turn this off. The admin console stays available."
                confirmLabel="Take site offline"
                busy={maintSaving}
                onCancel={() => setConfirmOffline(false)}
                onConfirm={() => {
                  setConfirmOffline(false);
                  void saveMaintenance({ ...maint, enabled: true });
                }}
              />

              <AdminCard className="overflow-hidden">
                <AdminCardHeader
                  title="Site details"
                  subtitle="Read-only"
                />
                <div>
                  {SITE_DETAILS.map((item) => (
                    <RecordRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </div>
              </AdminCard>

              <AdminCard className="overflow-hidden">
                <AdminCardHeader title="Social links" meta="Read-only" />
                <div>
                  {SOCIAL_LINKS.map((item) => (
                    <RecordRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
                  ))}
                </div>
              </AdminCard>
            </>
          )}

          {activeTab !== "site" && (
            <AdminCard className="flex flex-wrap items-center justify-end gap-3 px-4 py-3">
              {showSaved && (
                <span role="status" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--adm-success-ink)]">
                  <Check className="h-4 w-4" />All changes saved
                </span>
              )}
              <WorkspaceButton variant="primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="animate-spin" aria-hidden="true" />Saving…</>
                ) : (
                  <><IconSave />Save changes</>
                )}
              </WorkspaceButton>
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  );
}
