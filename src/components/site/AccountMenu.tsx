"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { landingRouteFor, UserRole } from "@/lib/auth/config";
import { hrPortalUrl } from "@/lib/site-content";
import { signOutStaff, useStaffSession, type StaffSessionUser } from "./use-staff-session";

const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.HR]: "HR",
  [UserRole.RECRUITER]: "Recruiter",
  [UserRole.SALES]: "Sales",
  [UserRole.MEDIA]: "Media",
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?";

function links(user: StaffSessionUser) {
  const home = landingRouteFor(user.role);
  return [
    { href: home, label: home === "/portal" ? "Dashboard" : "Your workspace", external: false },
    { href: "/portal/settings", label: "Account settings", external: false },
    { href: hrPortalUrl("website"), label: "HR portal", external: true },
  ];
}

/** Signed-in staff only: who you are, and the way back into the portal. Renders nothing for visitors. */
export default function AccountMenu() {
  const { user } = useStaffSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const first = user.name.split(/\s+/)[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${user.name}`}
        className="flex min-h-11 items-center gap-2 pl-1 pr-2 text-[15px] font-medium text-navy-900 transition-colors hover:text-ocean-700"
      >
        <span aria-hidden className="grid size-9 place-items-center rounded-full bg-ocean-50 text-[13px] font-semibold text-ocean-700 ring-1 ring-inset ring-ocean-200">
          {initials(user.name)}
        </span>
        <span className="hidden sm:inline">{first}</span>
        <svg aria-hidden viewBox="0 0 16 16" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+12px)] z-50 w-64 bg-mist-0 p-2 shadow-xl ring-1 ring-mist-200">
          <div className="px-3 py-2">
            <p className="font-semibold text-navy-900">{user.name}</p>
            <p className="truncate text-[14px] text-mist-600">{user.email}</p>
            {user.role && <p className="mt-1 text-[13px] font-medium text-ocean-700">{ROLE_LABEL[user.role]}</p>}
          </div>
          <div className="my-1 h-px bg-mist-200" />
          {links(user).map((l) =>
            l.external ? (
              <a key={l.label} role="menuitem" href={l.href} target="_blank" rel="noopener" className="flex min-h-10 items-center px-3 text-[15px] hover:bg-mist-100">
                {l.label}
              </a>
            ) : (
              <Link key={l.label} role="menuitem" href={l.href} onClick={() => setOpen(false)} className="flex min-h-10 items-center px-3 text-[15px] hover:bg-mist-100">
                {l.label}
              </Link>
            ),
          )}
          <div className="my-1 h-px bg-mist-200" />
          <button type="button" role="menuitem" onClick={() => void signOutStaff()} className="flex min-h-10 w-full items-center px-3 text-left text-[15px] text-[#b42318] hover:bg-[#fef3f2]">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/** The same account links for the phone menu. */
export function MobileAccount() {
  const { user } = useStaffSession();
  if (!user) return null;
  return (
    <div className="gutter mt-6 border-b border-mist-200 pb-5">
      <p className="font-semibold text-navy-900">{user.name}</p>
      <p className="truncate text-[14px] text-mist-600">{user.email}</p>
      <ul className="mt-3 grid">
        {links(user).map((l) => (
          <li key={l.label}>
            {l.external ? (
              <a href={l.href} target="_blank" rel="noopener" className="flex min-h-12 items-center text-[17px] font-medium">
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="flex min-h-12 items-center text-[17px] font-medium">
                {l.label}
              </Link>
            )}
          </li>
        ))}
        <li>
          <button type="button" onClick={() => void signOutStaff()} className="flex min-h-12 w-full items-center text-left text-[17px] font-medium text-[#b42318]">
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
}
