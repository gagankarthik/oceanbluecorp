"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { company } from "@/lib/site-content";
import { useAuth } from "@/lib/auth";
import { landingRouteFor } from "@/lib/auth/config";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email as emailRule, required } from "@/lib/form-validation";
import FieldError from "@/components/site/FieldError";
import SubmitButton from "@/components/site/SubmitButton";
import { field, invalid, ErrorNote, PasswordInput, PasswordRules, StepLabel, SuccessNote, unmetRules } from "../fields";

type Step = "request" | "reset";
type Field = "email" | "code" | "password" | "confirm";

const IDS: Partial<Record<Field, string>> = { password: "new-password", confirm: "confirm-password" };

/** Cognito reset: email a code, then exchange it for a new password and sign in. */
export default function ForgotForm() {
  const router = useRouter();
  const { signInWithCredentials } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // Server failures only; field problems sit under their field.
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  const { errors, validateAll, revalidate, reset } = useFormErrors<Field>(() => {
    if (step === "request") {
      return collectErrors<Field>({
        email: check(email, required("Enter the email address you use for work."), emailRule("Enter your work email, like name@oceanbluecorp.com.")),
      } as Record<Field, string | undefined>);
    }
    const unmet = unmetRules(password);
    return collectErrors<Field>({
      code: check(code, required("Enter the code from your email.")),
      password: !password ? "Choose a new password." : unmet.length ? `Your password still needs ${unmet.join(", ")}.` : undefined,
      confirm: !confirm ? "Enter the password again." : confirm !== password ? "The passwords do not match." : undefined,
    } as Record<Field, string | undefined>);
  }, IDS);

  // A new step announces itself: focus lands on its heading.
  useEffect(() => {
    if (shownStep.current !== step) headingRef.current?.focus();
    shownStep.current = step;
  }, [step]);

  function go(next: Step) {
    reset();
    setError(null);
    setStep(next);
  }

  async function post(url: string, body: object, fallback: string) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || fallback);
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;
    const workEmail = email.trim();
    setEmail(workEmail);
    setError(null);
    setBusy(true);
    try {
      // The server answers the same for an unknown address, so this always advances.
      await post("/api/auth/forgot-password", { email: workEmail }, "Could not start the reset.");
      go("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the reset.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;
    const workEmail = email.trim();
    setError(null);
    setBusy(true);
    try {
      await post("/api/auth/reset-password", { email: workEmail, code: code.trim(), password }, "Could not reset the password.");
      try {
        const result = await signInWithCredentials(workEmail, password);
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

  return (
    <div>
      <StepLabel n={step === "request" ? 1 : 2} of={2} />
      <h1 ref={headingRef} tabIndex={-1} className="display text-head-sm outline-none">
        {step === "request" ? "Reset your password" : "Choose a new password"}
      </h1>

      {step === "request" ? (
        <form onSubmit={handleRequest} onBlur={revalidate} noValidate className="mt-2">
          <p className="text-small text-mist-600">Enter your work email and we will send you a reset code.</p>
          <label htmlFor="email" className="mt-6 block font-medium">
            Work email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@oceanbluecorp.com"
            className={field}
            {...invalid("email", errors.email)}
          />
          <FieldError id="email" message={errors.email} />
          <ErrorNote error={error} />
          <SubmitButton busy={busy} busyLabel="Sending…" full className="mt-6">
            Send reset code
          </SubmitButton>
        </form>
      ) : (
        <form onSubmit={handleReset} onBlur={revalidate} noValidate className="mt-2">
          <SuccessNote>If {email} has an account, a code is on its way. It can take a minute to arrive.</SuccessNote>
          <div className="mt-5 grid gap-4">
            <div>
              <label htmlFor="code" className="block font-medium">
                Reset code
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={field}
                {...invalid("code", errors.code)}
              />
              <FieldError id="code" message={errors.code} />
            </div>
            <PasswordInput
              id="new-password"
              label="New password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              error={errors.password}
            />
            <PasswordRules value={password} />
            <PasswordInput
              id="confirm-password"
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              error={errors.confirm}
            />
          </div>
          <ErrorNote error={error} />
          <SubmitButton busy={busy} busyLabel="Saving…" full className="mt-6">
            Change password and sign in
          </SubmitButton>
          <button type="button" onClick={() => go("request")} className="mt-4 min-h-10 text-small font-medium text-ocean-700 hover:underline">
            Send a new code
          </button>
        </form>
      )}

      <p className="mt-6 text-small text-mist-600">Still stuck? Call HR on {company.phone}.</p>
    </div>
  );
}
