"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@/lib/auth/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";

function getRoleRedirect(role: UserRole | null): string {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.HR:
    case UserRole.RECRUITER:
    case UserRole.SALES:
      return "/admin";
    default:
      // Authenticated but with no staff group, nowhere to send them.
      return "/";
  }
}

/* One entry per step, so the panel says where the person is instead of
   showing the same welcome through a four-step flow. Each body line states
   what happens next rather than describing the product. */
const PANEL: Record<"signin" | "complete" | "forgot" | "reset", { eyebrow: string; title: string; body: string }> = {
  signin: {
    eyebrow: "Ocean Blue Corporation",
    title: "The staff console.",
    body: "Jobs, applications, candidates and contacts, in one place. Your role decides what you see, and an administrator set it when they added you.",
  },
  complete: {
    eyebrow: "Step 2 of 2 · New account",
    title: "Finish setting up.",
    body: "Confirm your name and number, then choose a password you will keep. The temporary one from your invitation stops working after this.",
  },
  forgot: {
    eyebrow: "Password reset",
    title: "Locked out?",
    body: "Give us the address on your account and we will email a six-digit code. It is good for one reset.",
  },
  reset: {
    eyebrow: "Step 2 of 2 · Password reset",
    title: "Choose a new one.",
    body: "Enter the code from your email and set the password. We will sign you in with it straight away.",
  },
};

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", label: "US/CA" },
  { code: "+91", flag: "🇮🇳", label: "IN" },
];

// Mirrors the user pool's password policy exactly (min 8 + upper + lower +
// number + symbol). Checking it here is what keeps a rejected password from
// costing the user their challenge session: Cognito burns the session on a
// refusal, so a policy miss used to turn the next attempt into "session
// expired" rather than the advice they needed.
const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "8 characters", test: (v) => v.length >= 8 },
  { label: "an uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "a lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "a number", test: (v) => /\d/.test(v) },
  // Cognito counts only this set as a symbol, a wider test would pass here
  // and still be refused server-side.
  { label: "a symbol", test: (v) => /[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`+=-]/.test(v) },
];

type E4 = [number, number, number, number];
const ease: E4 = [0.16, 1, 0.3, 1];
// Repeated verbatim on all four steps; kept here so a change lands on every
// one of them rather than on whichever three someone remembers.
const headingClass =
  "hz-display mb-1.5 text-[1.8rem] font-bold text-[var(--hz-text)]";
const submitClass =
  "hz-focus mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--hz-cobalt)] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70";
const inputClass =
  "w-full rounded-lg border border-[var(--hz-paper-line)] bg-[var(--hz-paper)] px-4 py-3 text-sm text-[var(--hz-text)] placeholder-[var(--hz-text-subtle)] outline-none transition focus:border-[var(--hz-cobalt)] focus:bg-white focus:ring-2 focus:ring-[var(--hz-cobalt-100)]";

function PhoneInput({
  value, onChange, prefix, onPrefixChange,
}: {
  value: string; onChange: (v: string) => void;
  prefix: string; onPrefixChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = COUNTRY_CODES.find((c) => c.code === prefix) ?? COUNTRY_CODES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex overflow-hidden rounded-lg border border-[var(--hz-paper-line)] bg-[var(--hz-paper)] transition focus-within:border-[var(--hz-cobalt)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--hz-cobalt-100)]">
      <div ref={ref} className="relative flex-shrink-0">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-full items-center gap-1.5 border-r border-[var(--hz-paper-line)] bg-transparent px-3 py-3 text-sm text-[var(--hz-text-mute)] transition-colors hover:bg-[var(--hz-paper)]">
          <span>{selected.flag}</span>
          <span className="font-medium">{selected.code}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-[var(--hz-text-subtle)] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="absolute left-0 top-full z-20 mt-1 w-36 rounded-xl border border-[var(--hz-paper-line)] bg-white py-1 shadow-lg">
              {COUNTRY_CODES.map((c) => (
                <li key={c.code}>
                  <button type="button" onClick={() => { onPrefixChange(c.code); setOpen(false); }} className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--hz-paper)] ${c.code === prefix ? "font-semibold text-[var(--hz-cobalt)]" : "text-[var(--hz-text-mute)]"}`}>
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                    <span className="ml-auto text-xs text-[var(--hz-text-subtle)]">{c.label}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <input type="tel" autoComplete="tel-national" inputMode="numeric" required value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} placeholder={prefix === "+1" ? "2025551234" : "9876543210"} maxLength={10} className="flex-1 bg-transparent px-3 py-3 text-sm text-[var(--hz-text)] placeholder-[var(--hz-text-subtle)] outline-none" />
    </div>
  );
}

export default function SignInPage() {
  const { isAuthenticated, isLoading, user, signInWithCredentials, completeNewPassword } = useAuth();
  const router = useRouter();

  // "signin" = email + password. "complete" = invited user setting up their
  // account (full name, phone, permanent password) on first sign-in.
  const [step, setStep] = useState<"signin" | "complete" | "forgot" | "reset">("signin");
  // Reset flow. `resetSent` keeps the confirmation visible on the reset step
  // so someone who lands there knows a code is actually on its way.
  const [resetCode, setResetCode] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPw] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Complete-invite step. `challengeUsername` / `requiredAttributes` come from
  // Cognito with the challenge and have to travel back with the answer.
  const [session, setSession] = useState("");
  const [challengeUsername, setChallengeUsername] = useState("");
  const [requiredAttributes, setRequiredAttributes] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPw] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) router.push(getRoleRedirect(user.role));
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[var(--hz-cobalt)]" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signInWithCredentials(email, password);
      if (result.status === "NEW_PASSWORD_REQUIRED") {
        setSession(result.session);
        setChallengeUsername(result.username);
        setRequiredAttributes(result.requiredAttributes);
        setStep("complete");
      } else {
        router.push(getRoleRedirect(result.user.role));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const passwordsMatch = confirmPassword === "" || newPassword === confirmPassword;
  const unmetRules = PASSWORD_RULES.filter((r) => !r.test(newPassword));

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (unmetRules.length > 0) {
      setError(`Your password still needs ${unmetRules.map((r) => r.label).join(", ")}.`);
      return;
    }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (phoneNumber.length !== 10) { setError("Enter a valid 10-digit phone number."); return; }
    setSubmitting(true);
    try {
      const authUser = await completeNewPassword({
        email, session, name,
        phone: `${phonePrefix}${phoneNumber}`,
        password: newPassword,
        username: challengeUsername,
        requiredAttributes,
        // Cognito burns the challenge session on any rejected answer. Keeping
        // the temporary password to hand lets the server start a fresh one, so
        // a corrected second attempt works instead of dying as "expired".
        tempPassword: password,
      });
      router.push(getRoleRedirect(authUser.role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not complete your account setup.");
      // That session is spent whatever the reason was. Dropping it now means the
      // next attempt starts from a fresh one, sending it again would only earn
      // an "expired" error in place of the message the user needs to see.
      setSession("");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Password reset ────────────────────────────────────────
  // Step one asks Cognito to email a code. The server answers identically for
  // an unknown address, so this always advances rather than confirming whether
  // the account exists.
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) { setError("Enter your email address."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start the reset.");
      setResetSent(true);
      setStep("reset");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not start the reset.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step two exchanges the code for a new password, then signs the person in
  // with it so they never have to type it twice.
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!resetCode.trim()) { setError("Enter the code from your email."); return; }
    if (unmetRules.length > 0) {
      setError(`Your password still needs ${unmetRules.map((r) => r.label).join(", ")}.`);
      return;
    }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset the password.");

      const result = await signInWithCredentials(email, newPassword);
      if (result.status === "NEW_PASSWORD_REQUIRED") {
        // Should not happen after a completed reset, but never strand them.
        setSession(result.session);
        setChallengeUsername(result.username);
        setRequiredAttributes(result.requiredAttributes);
        setStep("complete");
      } else {
        router.push(getRoleRedirect(result.user.role));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Left brand panel (shared) ─────────────────────────────
  /* Photographic, with the same two scrim ramps every PageHero uses, so the
     door to the console reads as part of the same site rather than as a
     detached product screen.

     The three feature bullets that used to sit here are gone on purpose. This
     is an invite-only console: everyone who reaches this screen was already
     added by an administrator, so selling them on "real-time tracking" is
     copy aimed at someone who cannot be standing here. What replaced it is
     what a person at a locked door actually needs, which of the four steps
     they are on, and who to ask if they are stuck. */
  const brandPanel = (
    <div className="relative hidden w-1/2 overflow-hidden bg-[var(--hz-ink)] lg:block">
      <Photo src={IMG.aboutHero} alt="" className="absolute inset-0 h-full w-full object-cover" sizes="50vw" priority />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,10,24,0.78) 0%, rgba(4,10,24,0.52) 34%, rgba(4,10,24,0.72) 74%, rgba(4,10,24,0.94) 100%), linear-gradient(90deg, rgba(4,10,24,0.80) 0%, rgba(4,10,24,0.52) 40%, rgba(4,10,24,0.20) 68%, rgba(4,10,24,0.08) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-14">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="hz-focus-dark inline-block" aria-label="Ocean Blue Corporation, home">
            {/* No white artwork exists; the colour mark inverts cleanly to white. */}
            <Image src="/logo.png" alt="Ocean Blue Corporation" width={340} height={80} className="h-9 w-auto brightness-0 invert" />
          </Link>
          <Link href="/" className="hz-focus-dark group inline-flex items-center gap-2 text-[13px] text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to site
          </Link>
        </div>

        <div className="max-w-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
            {PANEL[step].eyebrow}
          </p>
          <motion.h2
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="hz-display mt-4 text-[2.6rem] font-semibold text-white"
          >
            {PANEL[step].title}
          </motion.h2>
          <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-white/70">
            {PANEL[step].body}
          </p>
        </div>

        <div className="flex items-end justify-between gap-6">
          <p className="max-w-[34ch] text-[12px] leading-relaxed text-white/45">
            Access is granted by an administrator. If you need an account or your
            invitation expired, email{" "}
            <a href="mailto:hr@oceanbluecorp.com" className="hz-focus-dark text-white/70 underline underline-offset-2 hover:text-white">
              hr@oceanbluecorp.com
            </a>
            .
          </p>
          <p className="flex-none text-[11px] text-white/35">© {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );

  // The server may append the identity provider's own reason after a newline;
  // show it quieter, under the headline, so a rejected setup is diagnosable.
  const [errorHeadline, ...errorDetail] = (error ?? "").split("\n");

  const errorBanner = (
    <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            {errorHeadline}
            {errorDetail.length > 0 && (
              <span className="mt-1 block text-[11px] leading-relaxed text-red-600/80">
                {errorDetail.join(" ")}
              </span>
            )}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex min-h-screen w-full bg-white">
      {brandPanel}

      {/* Form half */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text)]">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mx-auto w-full max-w-[400px]">
          <div className="mb-7 flex justify-center lg:hidden">
            <Image src="/logo.png" alt="Ocean Blue" width={140} height={32} className="h-7 w-auto" />
          </div>

          {step === "signin" ? (
            <>
              <h1 className={headingClass}>
                Sign in
              </h1>
              <p className="mb-8 text-sm text-[var(--hz-text-subtle)]">Enter your credentials to continue.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorBanner}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[13px] font-medium text-[var(--hz-text-mute)]">Email address</label>
                  <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[13px] font-medium text-[var(--hz-text-mute)]">Password</label>
                  <div className="relative">
                    <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text-mute)]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="pt-1 text-right">
                    <button
                      type="button"
                      onClick={() => { setStep("forgot"); setError(null); }}
                      className="text-[13px] font-medium text-[var(--hz-cobalt)] underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={submitClass}>
                  {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p className="mt-8 text-center text-xs text-[var(--hz-text-subtle)]">
                Accounts are created by invitation. Contact your administrator if you need access.
              </p>

              <p className="mt-6 text-center text-xs text-[var(--hz-text-subtle)]">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-[var(--hz-cobalt)] hover:underline">Terms</Link> and{" "}
                <Link href="/privacy" className="text-[var(--hz-cobalt)] hover:underline">Privacy Policy</Link>
              </p>
            </>
          ) : step === "forgot" ? (
            <>
              <h1 className={headingClass}>
                Reset your password
              </h1>
              <p className="mb-7 text-sm text-[var(--hz-text-subtle)]">
                Enter your work email and we will send you a verification code.
              </p>

              <form onSubmit={handleForgot} className="space-y-4">
                {errorBanner}

                <div className="space-y-1.5">
                  <label htmlFor="resetEmail" className="block text-[13px] font-medium text-[var(--hz-text-mute)]">Email address</label>
                  <input id="resetEmail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                </div>

                <button type="submit" disabled={isSubmitting} className={submitClass}>
                  {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
                  {isSubmitting ? "Sending…" : "Send code"}
                </button>
              </form>

              <button type="button" onClick={() => { setStep("signin"); setError(null); }} className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text)]">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </>
          ) : step === "reset" ? (
            <>
              <h1 className={headingClass}>
                Choose a new password
              </h1>
              <p className="mb-7 text-sm text-[var(--hz-text-subtle)]">
                {resetSent
                  ? <>If an account exists for <span className="font-medium text-[var(--hz-text-mute)]">{email}</span>, a code is on its way. Enter it below.</>
                  : <>Enter the code sent to <span className="font-medium text-[var(--hz-text-mute)]">{email}</span>.</>}
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                {errorBanner}

                <div className="space-y-1.5">
                  <label htmlFor="resetCode" className="block text-[13px] font-medium text-[var(--hz-text-mute)]">Verification code</label>
                  <input id="resetCode" type="text" inputMode="numeric" autoComplete="one-time-code" required value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="123456" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="resetPassword" className="block text-[13px] font-medium text-[var(--hz-text-mute)]">New password</label>
                  <div className="relative">
                    <input id="resetPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text-mute)]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && unmetRules.length > 0 && (
                    <p className="pt-1 text-[12px] text-[var(--hz-text-subtle)]">
                      Still needs {unmetRules.map((r) => r.label).join(", ")}.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="resetConfirm" className="block text-[13px] font-medium text-[var(--hz-text-mute)]">Confirm new password</label>
                  <div className="relative">
                    <input id="resetConfirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter your password" className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text-mute)]">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!passwordsMatch && <p className="pt-1 text-[12px] text-red-600">Passwords do not match.</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className={submitClass}>
                  {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
                  {isSubmitting ? "Resetting…" : "Reset password and sign in"}
                </button>
              </form>

              <button type="button" onClick={() => { setStep("forgot"); setError(null); setResetCode(""); }} className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text)]">
                <ArrowLeft className="h-3.5 w-3.5" /> Send a new code
              </button>
            </>
          ) : (
            <>
              <h1 className={headingClass}>
                Complete your account
              </h1>
              <p className="mb-7 text-sm text-[var(--hz-text-subtle)]">
                Welcome to Ocean Blue. Confirm your details and choose a password for <span className="font-medium text-[var(--hz-text-mute)]">{email}</span>.
              </p>

              <form onSubmit={handleComplete} className="space-y-4">
                {errorBanner}

                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-[13px] font-medium text-[var(--hz-text-mute)]">Full name</label>
                  <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[var(--hz-text-mute)]">Phone number</label>
                  <PhoneInput value={phoneNumber} onChange={setPhoneNumber} prefix={phonePrefix} onPrefixChange={setPhonePrefix} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="block text-[13px] font-medium text-[var(--hz-text-mute)]">New password</label>
                  <div className="relative">
                    <input id="newPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text-mute)]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && unmetRules.length > 0 ? (
                    <p className="text-[11px] text-amber-600">
                      Still needs {unmetRules.map((r) => r.label).join(", ")}.
                    </p>
                  ) : newPassword ? (
                    <p className="flex items-center gap-1 text-[11px] text-emerald-600">
                      <CheckCircle className="h-3 w-3" /> Meets all requirements
                    </p>
                  ) : (
                    <p className="text-[11px] text-[var(--hz-text-subtle)]">
                      At least 8 characters, with uppercase, lowercase, number, and symbol.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPw" className="block text-[13px] font-medium text-[var(--hz-text-mute)]">Confirm password</label>
                  <div className="relative">
                    <input
                      id="confirmPw" type={showConfirm ? "text" : "password"} autoComplete="new-password" required
                      value={confirmPassword} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter your password"
                      className={`w-full rounded-lg border bg-[var(--hz-paper)] px-4 py-3 pr-11 text-sm text-[var(--hz-text)] placeholder-[var(--hz-text-subtle)] outline-none transition focus:bg-white focus:ring-2 ${
                        !passwordsMatch
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : confirmPassword && newPassword === confirmPassword
                          ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                          : "border-[var(--hz-paper-line)] focus:border-[var(--hz-cobalt)] focus:ring-[var(--hz-cobalt-100)]"
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-text-mute)]">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!passwordsMatch && <p className="text-[11px] text-red-500">Passwords do not match.</p>}
                  {confirmPassword && passwordsMatch && newPassword === confirmPassword && (
                    <p className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle className="h-3 w-3" /> Passwords match</p>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting} className={submitClass}>
                  {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
                  {isSubmitting ? "Setting up…" : "Complete setup"}
                </button>
              </form>

              {/* An invite session is single-use and short-lived; without this
                  an expired one strands the user on a form that can't submit. */}
              <p className="mt-6 text-center text-xs text-[var(--hz-text-subtle)]">
                Session expired?{" "}
                <button
                  type="button"
                  onClick={() => { setStep("signin"); setError(null); setSession(""); setPassword(""); }}
                  className="text-[var(--hz-cobalt)] hover:underline"
                >
                  Start over
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
