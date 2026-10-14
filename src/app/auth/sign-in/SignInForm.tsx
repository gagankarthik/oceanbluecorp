"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { company } from "@/lib/site-content";
import { useAuth } from "@/lib/auth";
import { landingRouteFor } from "@/lib/auth/config";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email as emailRule, phone as phoneRule, required, toE164 } from "@/lib/form-validation";
import FieldError from "@/components/site/FieldError";
import SubmitButton from "@/components/site/SubmitButton";
import { field, invalid, ErrorNote, PasswordInput, PasswordRules, StepLabel, unmetRules } from "../fields";

type Step = "signin" | "complete";
type Field = "email" | "password" | "name" | "phone" | "newPassword" | "confirm";

const IDS: Partial<Record<Field, string>> = { name: "full-name", newPassword: "new-password", confirm: "confirm-password" };

/** Staff sign-in against Cognito; invited users finish account setup on the second step. */
export default function SignInForm() {
  const router = useRouter();
  const { isAuthenticated, user, signInWithCredentials, completeNewPassword } = useAuth();
  const [step, setStep] = useState<Step>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  // Cognito and network failures only; field problems sit under their field.
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  // Invite challenge: these travel back to Cognito with the answer.
  const [session, setSession] = useState("");
  const [challengeUsername, setChallengeUsername] = useState("");
  const [requiredAttributes, setRequiredAttributes] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const { errors, validateAll, revalidate, reset } = useFormErrors<Field>(() => {
    if (step === "signin") {
      return collectErrors<Field>({
        email: check(email, required("Enter the email address you use for work."), emailRule("Enter your work email, like name@oceanbluecorp.com.")),
        password: check(password, required("Enter your password.")),
      } as Record<Field, string | undefined>);
    }
    const unmet = unmetRules(newPassword);
    return collectErrors<Field>({
      name: check(name, required("Enter your full name.")),
      phone: check(phone, required("Enter your mobile number."), phoneRule()),
      newPassword: !newPassword ? "Choose a new password." : unmet.length ? `Your password still needs ${unmet.join(", ")}.` : undefined,
      confirm: !confirm ? "Enter the password again." : confirm !== newPassword ? "The passwords do not match." : undefined,
    } as Record<Field, string | undefined>);
  }, IDS);

  const landing = (role: Parameters<typeof landingRouteFor>[0]) => {
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/portal") ? next : landingRouteFor(role));
  };

  useEffect(() => {
    if (isAuthenticated && user) landing(user.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // A new step announces itself: focus lands on its heading.
  useEffect(() => {
    if (shownStep.current !== step) headingRef.current?.focus();
    shownStep.current = step;
  }, [step]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;
    const workEmail = email.trim();
    setEmail(workEmail);
    setError(null);
    setBusy(true);
    try {
      const result = await signInWithCredentials(workEmail, password);
      if (result.status === "NEW_PASSWORD_REQUIRED") {
        setSession(result.session);
        setChallengeUsername(result.username);
        setRequiredAttributes(result.requiredAttributes);
        reset();
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
    if (!validateAll()) return;
    setError(null);
    setBusy(true);
    try {
      const authUser = await completeNewPassword({
        email: email.trim(),
        session,
        name: name.trim(),
        phone: toE164(phone),
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

  const heading = "display text-head-sm outline-none";

  if (step === "complete") {
    return (
      <form onSubmit={handleComplete} onBlur={revalidate} noValidate>
        <StepLabel n={2} of={2} />
        <h1 ref={headingRef} tabIndex={-1} className={heading}>
          Set up your account
        </h1>
        <p className="mt-1 text-small text-mist-600">Welcome to Oceanblue. Add your details and choose a password.</p>
        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="full-name" className="block font-medium">
              Full name
            </label>
            <input
              id="full-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              className={field}
              {...invalid("full-name", errors.name)}
            />
            <FieldError id="full-name" message={errors.name} />
          </div>
          <div>
            <label htmlFor="phone" className="block font-medium">
              Mobile phone
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="(614) 555-0100"
              required
              className={field}
              {...invalid("phone", errors.phone)}
            />
            <FieldError id="phone" message={errors.phone} />
          </div>
          <PasswordInput
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            error={errors.newPassword}
          />
          <PasswordRules value={newPassword} />
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
          Finish and sign in
        </SubmitButton>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignIn} onBlur={revalidate} noValidate>
      <h1 ref={headingRef} tabIndex={-1} className={heading}>
        Employee sign in
      </h1>
      <p className="mt-1 text-small text-mist-600">Use your Oceanblue work email and password.</p>

      <div className="mt-5 grid gap-4">
        <div>
          <label htmlFor="email" className="block font-medium">
            Work email
          </label>
          <input
            id="email"
            type="email"
            name="email"
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
        </div>

        <div>
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            error={errors.password}
            aside={
              <Link href="/auth/forgot-password" className="text-small font-medium text-ocean-700 underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            }
          />
          {capsLock && <p className="mt-2 text-small font-medium text-navy-900">Caps Lock is on.</p>}
        </div>
      </div>

      <ErrorNote error={error} />

      <SubmitButton busy={busy} busyLabel="Signing in…" full className="mt-6">
        Sign in
      </SubmitButton>

      <p className="mt-5 text-small text-mist-600">
        Access is by invitation. Need help?{" "}
        <a href={`mailto:${company.email}?subject=Sign-in%20help`} className="font-medium text-ocean-700 underline underline-offset-4">
          Contact HR
        </a>
      </p>
    </form>
  );
}
