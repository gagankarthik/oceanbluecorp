"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { company } from "@/lib/site-content";
import { useAuth } from "@/lib/auth";
import { landingRouteFor } from "@/lib/auth/config";
import { field, ErrorNote, PasswordInput, PasswordRules, SuccessNote, unmetRules } from "../fields";

/** Cognito reset: email a code, then exchange it for a new password and sign in. */
export default function ForgotForm() {
  const router = useRouter();
  const { signInWithCredentials } = useAuth();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: object, fallback: string) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || fallback);
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email address you use for work.");
    setError(null);
    setBusy(true);
    try {
      // The server answers the same for an unknown address, so this always advances.
      await post("/api/auth/forgot-password", { email }, "Could not start the reset.");
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the reset.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const unmet = unmetRules(password);
    if (!code.trim()) return setError("Enter the code from your email.");
    if (unmet.length) return setError(`Your password still needs ${unmet.join(", ")}.`);
    if (password !== confirm) return setError("The passwords do not match.");
    setError(null);
    setBusy(true);
    try {
      await post("/api/auth/reset-password", { email, code: code.trim(), password }, "Could not reset the password.");
      try {
        const result = await signInWithCredentials(email, password);
        router.push(result.status === "AUTHENTICATED" ? landingRouteFor(result.user.role) : "/auth/sign-in");
      } catch {
        router.push("/auth/sign-in");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }

  const submit =
    "mt-6 flex min-h-12 w-full items-center justify-center bg-ocean-600 font-medium text-white transition-colors hover:bg-ocean-700 active:scale-[0.99] disabled:opacity-60";

  return (
    <div>

      <h1 className="display text-[clamp(1.625rem,2.4vw,2rem)]">Reset your password</h1>

      {step === "request" ? (
        <form onSubmit={handleRequest} noValidate className="mt-2">
          <p className="text-[15px] text-mist-600">Enter your work email and we will send you a reset code.</p>
          <label className="mt-6 block font-medium">
            Work email
            <input
              type="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@oceanbluecorp.com"
              className={field}
            />
          </label>
          <ErrorNote error={error} />
          <button type="submit" disabled={busy} className={submit}>
            {busy ? "Sending…" : "Send reset code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} noValidate className="mt-2">
          <SuccessNote>If {email} has an account, a code is on its way. It can take a minute to arrive.</SuccessNote>
          <div className="mt-5 grid gap-4">
            <label className="block font-medium">
              Reset code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={field}
              />
            </label>
            <PasswordInput id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
            <PasswordRules value={password} />
            <PasswordInput id="confirm-password" label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </div>
          <ErrorNote error={error} />
          <button type="submit" disabled={busy} className={submit}>
            {busy ? "Saving…" : "Change password and sign in"}
          </button>
          <button type="button" onClick={() => setStep("request")} className="mt-4 text-[15px] font-medium text-ocean-700 hover:underline">
            Send a new code
          </button>
        </form>
      )}

      <p className="mt-6 text-[15px] text-mist-600">Still stuck? Call HR on {company.phone}.</p>
    </div>
  );
}
