"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@/lib/auth/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, ShieldCheck, BarChart2, Users, CheckCircle, ChevronDown } from "lucide-react";
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
      // Authenticated but with no staff group — nowhere to send them.
      return "/";
  }
}

const FEATURES = [
  { icon: ShieldCheck, label: "Secure, role-based access" },
  { icon: BarChart2, label: "Real-time application tracking" },
  { icon: Users, label: "Centralized candidate management" },
];

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", label: "US/CA" },
  { code: "+91", flag: "🇮🇳", label: "IN" },
];

type E4 = [number, number, number, number];
const ease: E4 = [0.16, 1, 0.3, 1];
const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#1d4ed8] focus:bg-white focus:ring-2 focus:ring-[#dbe6fe]";

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
    <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-gray-50/70 transition focus-within:border-[#1d4ed8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dbe6fe]">
      <div ref={ref} className="relative flex-shrink-0">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-full items-center gap-1.5 border-r border-gray-200 bg-transparent px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-100">
          <span>{selected.flag}</span>
          <span className="font-medium">{selected.code}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="absolute left-0 top-full z-20 mt-1 w-36 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              {COUNTRY_CODES.map((c) => (
                <li key={c.code}>
                  <button type="button" onClick={() => { onPrefixChange(c.code); setOpen(false); }} className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${c.code === prefix ? "font-semibold text-[#1d4ed8]" : "text-gray-700"}`}>
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                    <span className="ml-auto text-xs text-gray-400">{c.label}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <input type="tel" autoComplete="tel-national" inputMode="numeric" required value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} placeholder={prefix === "+1" ? "2025551234" : "9876543210"} maxLength={10} className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none" />
    </div>
  );
}

export default function SignInPage() {
  const { isAuthenticated, isLoading, user, signInWithCredentials, completeNewPassword } = useAuth();
  const router = useRouter();

  // "signin" = email + password. "complete" = invited user setting up their
  // account (full name, phone, permanent password) on first sign-in.
  const [step, setStep] = useState<"signin" | "complete">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPw] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Complete-invite step
  const [session, setSession] = useState("");
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#1d4ed8]" />
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

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (phoneNumber.length !== 10) { setError("Enter a valid 10-digit phone number."); return; }
    setSubmitting(true);
    try {
      const authUser = await completeNewPassword({
        email, session, name,
        phone: `${phonePrefix}${phoneNumber}`,
        password: newPassword,
      });
      router.push(getRoleRedirect(authUser.role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not complete your account setup.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Left brand panel (shared) ─────────────────────────────
  const brandPanel = (
    <div className="relative hidden w-1/2 overflow-hidden lg:block">
      <Photo src={IMG.auth} className="z-0" fallback="linear-gradient(150deg, #0a2540 0%, #07142b 100%)" />
      <div aria-hidden className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(160deg, rgba(7,20,43,0.72) 0%, rgba(5,12,28,0.9) 100%)" }} />
      <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-14">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="max-w-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Ocean Blue Corporation</p>
          <h2 className="mt-4 text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
            {step === "complete" ? "Set up your account." : "Welcome back."}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/65">
            {step === "complete"
              ? "Finish setting up your team account — choose a password and confirm your details."
              : "Sign in to manage applications, track hiring progress, and connect with top talent."}
          </p>
          <div className="mt-9 space-y-3.5">
            {FEATURES.map(({ icon: Icon, label }, i) => (
              <motion.div key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1, ease }} className="flex items-center gap-3 text-[14px] text-white/80">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-[var(--hz-cyan-400)]" strokeWidth={1.75} />
                </span>
                {label}
              </motion.div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-white/35">© {new Date().getFullYear()} Ocean Blue Corporation</p>
      </div>
    </div>
  );

  const errorBanner = (
    <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
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
          <Link href="/" className="group inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mx-auto w-full max-w-[400px]">
          <div className="mb-7 flex justify-center lg:hidden">
            <Image src="/logo.png" alt="Ocean Blue" width={140} height={32} className="h-7 w-auto" />
          </div>

          {step === "signin" ? (
            <>
              <h1 className="mb-1.5 text-[1.9rem] tracking-tight text-gray-900" style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.025em" }}>
                Sign in
              </h1>
              <p className="mb-8 text-sm text-gray-500">Enter your credentials to continue.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorBanner}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[13px] font-medium text-gray-600">Email address</label>
                  <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[13px] font-medium text-gray-600">Password</label>
                  <div className="relative">
                    <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d4ed8] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1740ad] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70" style={{ fontFamily: "var(--font-display)" }}>
                  {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p className="mt-8 text-center text-xs text-gray-400">
                Accounts are created by invitation. Contact your administrator if you need access.
              </p>

              <p className="mt-6 text-center text-xs text-gray-400">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-[#1d4ed8] hover:underline">Terms</Link> and{" "}
                <Link href="/privacy" className="text-[#1d4ed8] hover:underline">Privacy Policy</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="mb-1.5 text-[1.8rem] tracking-tight text-gray-900" style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.025em" }}>
                Complete your account
              </h1>
              <p className="mb-7 text-sm text-gray-500">
                Welcome to Ocean Blue. Confirm your details and choose a password for <span className="font-medium text-gray-700">{email}</span>.
              </p>

              <form onSubmit={handleComplete} className="space-y-4">
                {errorBanner}

                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-[13px] font-medium text-gray-600">Full name</label>
                  <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-gray-600">Phone number</label>
                  <PhoneInput value={phoneNumber} onChange={setPhoneNumber} prefix={phonePrefix} onPrefixChange={setPhonePrefix} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="block text-[13px] font-medium text-gray-600">New password</label>
                  <div className="relative">
                    <input id="newPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">Uppercase, lowercase, number, and symbol required.</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPw" className="block text-[13px] font-medium text-gray-600">Confirm password</label>
                  <div className="relative">
                    <input
                      id="confirmPw" type={showConfirm ? "text" : "password"} autoComplete="new-password" required
                      value={confirmPassword} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter your password"
                      className={`w-full rounded-lg border bg-gray-50/70 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:bg-white focus:ring-2 ${
                        !passwordsMatch
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : confirmPassword && newPassword === confirmPassword
                          ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                          : "border-gray-200 focus:border-[#1d4ed8] focus:ring-[#dbe6fe]"
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!passwordsMatch && <p className="text-[11px] text-red-500">Passwords do not match.</p>}
                  {confirmPassword && passwordsMatch && newPassword === confirmPassword && (
                    <p className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle className="h-3 w-3" /> Passwords match</p>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting} className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d4ed8] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1740ad] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70" style={{ fontFamily: "var(--font-display)" }}>
                  {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
                  {isSubmitting ? "Setting up…" : "Complete setup"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
