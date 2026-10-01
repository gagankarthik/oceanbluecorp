"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { landingRouteFor } from "@/lib/auth/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Select } from "@/components/site/select";
import { IconArrowLeft, IconArrowRight, IconAlert, IconCheck } from "@/components/site/icons";
import { AuthShell, IconEye, IconEyeOff } from "../auth-shell";

type Step = "signin" | "complete" | "forgot" | "reset";

/* One entry per step, so the panel says where the person is instead of
   showing the same welcome through a four-step flow. */
const PANEL: Record<Step, { kicker: string; title: string; body: string }> = {
  signin: {
    kicker: "",
    title: "The staff console.",
    body: "Jobs, applications, candidates and contacts, in one place. Your role decides what you see, and an administrator set it when they added you.",
  },
  complete: {
    kicker: "Step 2 of 2 · New account",
    title: "Finish setting up.",
    body: "Confirm your name and number, then choose a password you will keep. The temporary one from your invitation stops working after this.",
  },
  forgot: {
    kicker: "Password reset",
    title: "Locked out?",
    body: "Give us the address on your account and we will email a six-digit code. It is good for one reset.",
  },
  reset: {
    kicker: "Step 2 of 2 · Password reset",
    title: "Choose a new one.",
    body: "Enter the code from your email and set the password. We will sign you in with it straight away.",
  },
};

const COUNTRY_CODES = [
  { value: "+1", label: "🇺🇸 +1", hint: "US/CA" },
  { value: "+91", label: "🇮🇳 +91", hint: "IN" },
];

// Mirrors the user pool's password policy exactly (min 8 + upper + lower +
// number + symbol). Checking it here keeps a rejected password from costing
// the user their challenge session: Cognito burns the session on a refusal.
const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "8 characters", test: (v) => v.length >= 8 },
  { label: "an uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "a lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "a number", test: (v) => /\d/.test(v) },
  // Cognito counts only this set as a symbol; a wider test would pass here
  // and still be refused server-side.
  { label: "a symbol", test: (v) => /[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`+=-]/.test(v) },
];

const inputCls =
  "h-12 w-full rounded-xl border border-line-strong bg-white px-4 type-body text-ink placeholder:text-ink-subtle transition-colors duration-150 hover:border-ink-subtle focus:border-cobalt focus:ring-4 focus:ring-cobalt/15 focus:outline-none aria-[invalid=true]:border-danger";
const labelCls = "mb-1.5 block type-label text-ink";
const submitCls =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cobalt px-6 type-label text-white transition-colors duration-150 hover:bg-cobalt-deep disabled:cursor-not-allowed disabled:opacity-60";
const quietBtnCls = "inline-flex items-center gap-1.5 type-label font-medium text-ink-muted transition-colors duration-150 hover:text-ink";

function Spinner() {
  return <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  invalid,
  describedBy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(inputCls, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle transition-colors duration-150 hover:bg-paper hover:text-ink"
        >
          {show ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </div>
  );
}

/** Live checklist of the password policy: each rule ticks as it is met. */
function PasswordRules({ value, id }: { value: string; id: string }) {
  return (
    <ul id={id} className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.label} className={cn("flex items-center gap-2 type-caption transition-colors duration-150", ok ? "text-success" : "text-ink-subtle")}>
            <span
              aria-hidden
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
                ok ? "border-success bg-success text-white" : "border-line-strong",
              )}
            >
              {ok && <IconCheck size={10} strokeWidth={2.5} />}
            </span>
            {r.label}
            <span className="sr-only">{ok ? ", met" : ", not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function SignInPage() {
  const { isAuthenticated, isLoading, user, signInWithCredentials, completeNewPassword } = useAuth();
  const router = useRouter();

  // "signin" = email + password. "complete" = invited user setting up their
  // account (full name, phone, permanent password) on first sign-in.
  const [step, setStep] = useState<Step>("signin");
  // `resetSent` keeps the confirmation visible on the reset step so someone
  // who lands there knows a code is actually on its way.
  const [resetCode, setResetCode] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `challengeUsername` / `requiredAttributes` come from Cognito with the
  // challenge and have to travel back with the answer.
  const [session, setSession] = useState("");
  const [challengeUsername, setChallengeUsername] = useState("");
  const [requiredAttributes, setRequiredAttributes] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPw] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) router.push(landingRouteFor(user.role));
  }, [isAuthenticated, user, router]);

  const go = (next: Step) => {
    setStep(next);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white" role="status" aria-label="Loading">
        <span className="size-9 animate-spin rounded-full border-[3px] border-cobalt-tint border-t-cobalt" />
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
        router.push(landingRouteFor(result.user.role));
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
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (phoneNumber.length !== 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    setSubmitting(true);
    try {
      const authUser = await completeNewPassword({
        email,
        session,
        name,
        phone: `${phonePrefix}${phoneNumber}`,
        password: newPassword,
        username: challengeUsername,
        requiredAttributes,
        // Cognito burns the challenge session on any rejected answer. Keeping
        // the temporary password to hand lets the server start a fresh one.
        tempPassword: password,
      });
      router.push(landingRouteFor(authUser.role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not complete your account setup.");
      // That session is spent whatever the reason; the next attempt must start fresh.
      setSession("");
    } finally {
      setSubmitting(false);
    }
  };

  // Step one asks Cognito to email a code. The server answers identically for
  // an unknown address, so this always advances.
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Enter your email address.");
      return;
    }
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

  // Step two exchanges the code for a new password, then signs the person in.
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!resetCode.trim()) {
      setError("Enter the code from your email.");
      return;
    }
    if (unmetRules.length > 0) {
      setError(`Your password still needs ${unmetRules.map((r) => r.label).join(", ")}.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset the password.");

      let result;
      try {
        result = await signInWithCredentials(email, newPassword);
      } catch {
        setStep("signin");
        setPassword("");
        setResetCode("");
        setError("Your password was changed. Sign in with the new one.");
        return;
      }
      if (result.status === "NEW_PASSWORD_REQUIRED") {
        // Should not happen after a completed reset, but never strand them.
        setSession(result.session);
        setChallengeUsername(result.username);
        setRequiredAttributes(result.requiredAttributes);
        setStep("complete");
      } else {
        router.push(landingRouteFor(result.user.role));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setSubmitting(false);
    }
  };

  // The server may append the identity provider's own reason after a newline;
  // show it quieter, under the headline, so a rejected setup is diagnosable.
  const [errorHeadline, ...errorDetail] = (error ?? "").split("\n");
  const errorBanner = error && (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-container px-4 py-3 text-danger">
      <IconAlert size={18} className="mt-0.5 shrink-0" />
      <span className="type-body-sm">
        {errorHeadline}
        {errorDetail.length > 0 && <span className="mt-1 block type-caption text-danger/85">{errorDetail.join(" ")}</span>}
      </span>
    </div>
  );

  const heading = (title: string, sub: React.ReactNode, stepLabel?: string) => (
    <div className="mb-7">
      {stepLabel && <p className="mb-2 type-label text-cobalt">{stepLabel}</p>}
      <h1 className="type-headline-sm text-ink">{title}</h1>
      <p className="mt-2 type-body text-ink-muted">{sub}</p>
    </div>
  );

  const panel = PANEL[step];

  return (
    <AuthShell kicker={panel.kicker} title={panel.title} body={panel.body}>
      <div key={step} className="rise">
        {step === "signin" && (
          <>
            {heading("Sign in", "Use the email and password from your invitation.")}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
              {errorBanner}
              <div>
                <label htmlFor="email" className={labelCls}>
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@oceanbluecorp.com"
                  className={inputCls}
                />
              </div>
              <div>
                <PasswordField id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
                <div className="mt-2 text-right">
                  <button type="button" onClick={() => go("forgot")} className="type-label font-medium text-cobalt underline-offset-4 hover:underline">
                    Forgot your password?
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className={submitCls}>
                {isSubmitting ? <Spinner /> : null}
                {isSubmitting ? "Signing in…" : "Sign in"}
                {!isSubmitting && <IconArrowRight size={16} />}
              </button>
            </form>

            <p className="mt-6 type-caption text-ink-subtle">
              Accounts are created by invitation; ask your administrator for access. By signing in, you agree to our{" "}
              <Link href="/terms" className="font-medium text-cobalt hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-cobalt hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </>
        )}

        {step === "forgot" && (
          <>
            {heading("Reset your password", "Enter your work email and we will send you a verification code.", "Step 1 of 2")}
            <form onSubmit={handleForgot} className="space-y-5">
              {errorBanner}
              <div>
                <label htmlFor="resetEmail" className={labelCls}>
                  Work email
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@oceanbluecorp.com"
                  className={inputCls}
                />
              </div>
              <button type="submit" disabled={isSubmitting} className={submitCls}>
                {isSubmitting ? <Spinner /> : null}
                {isSubmitting ? "Sending…" : "Send code"}
                {!isSubmitting && <IconArrowRight size={16} />}
              </button>
            </form>
            <button type="button" onClick={() => go("signin")} className={cn(quietBtnCls, "mt-6")}>
              <IconArrowLeft size={15} /> Back to sign in
            </button>
          </>
        )}

        {step === "reset" && (
          <>
            {heading(
              "Choose a new password",
              resetSent ? (
                <>
                  If an account exists for <span className="font-semibold text-ink">{email}</span>, a code is on its way. Enter it below.
                </>
              ) : (
                <>
                  Enter the code sent to <span className="font-semibold text-ink">{email}</span>.
                </>
              ),
              "Step 2 of 2",
            )}
            <form onSubmit={handleReset} className="space-y-5">
              {errorBanner}
              <div>
                <label htmlFor="resetCode" className={labelCls}>
                  Verification code
                </label>
                <input
                  id="resetCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-digit code"
                  className={cn(inputCls, "tracking-[0.3em] tabular-nums placeholder:tracking-normal")}
                />
              </div>
              <div>
                <PasswordField id="resetPassword" label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" describedBy="reset-rules" />
                <PasswordRules value={newPassword} id="reset-rules" />
              </div>
              <div>
                <PasswordField
                  id="resetConfirm"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPw}
                  autoComplete="new-password"
                  invalid={!passwordsMatch}
                  describedBy="reset-match"
                />
                <p id="reset-match" aria-live="polite" className="mt-2 min-h-[1.25rem] type-caption">
                  {!passwordsMatch && <span className="text-danger">Passwords do not match.</span>}
                  {confirmPassword && passwordsMatch && <span className="text-success">Passwords match.</span>}
                </p>
              </div>
              <button type="submit" disabled={isSubmitting} className={submitCls}>
                {isSubmitting ? <Spinner /> : null}
                {isSubmitting ? "Resetting…" : "Reset password and sign in"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                go("forgot");
                setResetCode("");
              }}
              className={cn(quietBtnCls, "mt-6")}
            >
              <IconArrowLeft size={15} /> Send a new code
            </button>
          </>
        )}

        {step === "complete" && (
          <>
            {heading(
              "Complete your account",
              <>
                Welcome to Ocean Blue. Confirm your details and choose a password for <span className="font-semibold text-ink">{email}</span>.
              </>,
              "Step 2 of 2",
            )}
            <form onSubmit={handleComplete} className="space-y-5">
              {errorBanner}
              <div>
                <label htmlFor="name" className={labelCls}>
                  Full name
                </label>
                <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputCls} />
              </div>
              <div>
                <p id="phone-label" className={labelCls}>
                  Phone number
                </p>
                <div className="flex gap-2">
                  <Select
                    id="phone-prefix"
                    label="Country code"
                    hideLabel
                    shape="field"
                    value={phonePrefix}
                    onValueChange={setPhonePrefix}
                    options={COUNTRY_CODES}
                    className="w-[124px] shrink-0"
                  />
                  <input
                    type="tel"
                    aria-labelledby="phone-label"
                    autoComplete="tel-national"
                    inputMode="numeric"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder={phonePrefix === "+1" ? "2025551234" : "9876543210"}
                    maxLength={10}
                    className={cn(inputCls, "min-w-0 flex-1 tabular-nums")}
                  />
                </div>
              </div>
              <div>
                <PasswordField id="newPassword" label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" describedBy="new-rules" />
                <PasswordRules value={newPassword} id="new-rules" />
              </div>
              <div>
                <PasswordField
                  id="confirmPw"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPw}
                  autoComplete="new-password"
                  invalid={!passwordsMatch}
                  describedBy="new-match"
                />
                <p id="new-match" aria-live="polite" className="mt-2 min-h-[1.25rem] type-caption">
                  {!passwordsMatch && <span className="text-danger">Passwords do not match.</span>}
                  {confirmPassword && passwordsMatch && <span className="text-success">Passwords match.</span>}
                </p>
              </div>
              <button type="submit" disabled={isSubmitting} className={submitCls}>
                {isSubmitting ? <Spinner /> : null}
                {isSubmitting ? "Setting up…" : "Complete setup"}
                {!isSubmitting && <IconArrowRight size={16} />}
              </button>
            </form>
            {/* An invite session is single-use and short-lived; without this an
                expired one strands the user on a form that cannot submit. */}
            <p className="mt-6 type-body-sm text-ink-muted">
              Session expired?{" "}
              <button
                type="button"
                onClick={() => {
                  go("signin");
                  setSession("");
                  setPassword("");
                }}
                className="font-semibold text-cobalt hover:underline"
              >
                Start over
              </button>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  );
}
