"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { company } from "@/lib/site-content";
import { useAuth } from "@/lib/auth";
import { landingRouteFor } from "@/lib/auth/config";
import { field, ErrorNote, PasswordInput, PasswordRules, unmetRules } from "../fields";

type Step = "signin" | "complete";

/** Staff sign-in against Cognito; invited users finish account setup on the second step. */
export default function SignInForm() {
  const router = useRouter();
  const { isAuthenticated, user, signInWithCredentials, completeNewPassword } = useAuth();
  const [step, setStep] = useState<Step>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Invite challenge: these travel back to Cognito with the answer.
  const [session, setSession] = useState("");
  const [challengeUsername, setChallengeUsername] = useState("");
  const [requiredAttributes, setRequiredAttributes] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const landing = (role: Parameters<typeof landingRouteFor>[0]) => {
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/portal") ? next : landingRouteFor(role));
  };

  useEffect(() => {
    if (isAuthenticated && user) landing(user.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email address you use for work.");
    if (!password) return setError("Enter your password.");
    setError(null);
    setBusy(true);
    try {
      const result = await signInWithCredentials(email, password);
      if (result.status === "NEW_PASSWORD_REQUIRED") {
        setSession(result.session);
        setChallengeUsername(result.username);
        setRequiredAttributes(result.requiredAttributes);
        setStep("complete");
      } else {
        landing(result.user.role);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    const unmet = unmetRules(newPassword);
    if (!name.trim()) return setError("Enter your full name.");
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) return setError("Enter a 10-digit US phone number.");
    if (unmet.length) return setError(`Your password still needs ${unmet.join(", ")}.`);
    if (newPassword !== confirm) return setError("The passwords do not match.");
    setError(null);
    setBusy(true);
    try {
      const authUser = await completeNewPassword({
        email,
        session,
        name: name.trim(),
        phone: `+1${digits}`,
        password: newPassword,
        username: challengeUsername,
        requiredAttributes,
        tempPassword: password,
      });
      landing(authUser.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish setting up your account.");
      setSession("");
    } finally {
      setBusy(false);
    }
  }

  const submit =
    "mt-6 flex min-h-12 w-full items-center justify-center bg-ocean-600 font-medium text-white transition-colors hover:bg-ocean-700 active:scale-[0.99] disabled:opacity-60";

  if (step === "complete") {
    return (
      <form onSubmit={handleComplete} noValidate>
        <h1 className="display text-[clamp(1.625rem,2.4vw,2rem)]">Set up your account</h1>
        <p className="mt-1 text-[15px] text-mist-600">Welcome to Oceanblue. Add your details and choose a password.</p>
        <div className="mt-5 grid gap-4">
          <label className="block font-medium">
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className={field} />
          </label>
          <label className="block font-medium">
            Mobile phone
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel-national"
              placeholder="614 555 0100"
              required
              className={field}
            />
          </label>
          <PasswordInput id="new-password" label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <PasswordRules value={newPassword} />
          <PasswordInput id="confirm-password" label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </div>
        <ErrorNote error={error} />
        <button type="submit" disabled={busy} className={submit}>
          {busy ? "Saving…" : "Finish and sign in"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignIn} noValidate>
      <h1 className="display text-[clamp(1.625rem,2.4vw,2rem)]">Employee sign in</h1>
      <p className="mt-1 text-[15px] text-mist-600">Use your Oceanblue work email and password.</p>

      <div className="mt-5 grid gap-4">
        <label className="block font-medium">
          Work email
          <input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@oceanbluecorp.com"
            className={field}
          />
        </label>

        <div>
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            aside={
              <Link href="/auth/forgot-password" className="text-[15px] font-medium text-ocean-700 underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            }
          />
          {capsLock && <p className="mt-2 text-[14px] font-medium text-navy-900">Caps Lock is on.</p>}
        </div>
      </div>

      <ErrorNote error={error} />

      <button type="submit" disabled={busy} className={submit}>
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <p className="mt-5 text-[15px] text-mist-600">
        Access is by invitation. Need help?{" "}
        <a href={`mailto:${company.email}?subject=Sign-in%20help`} className="font-medium text-ocean-700 underline underline-offset-4">
          Contact HR
        </a>
      </p>
    </form>
  );
}
