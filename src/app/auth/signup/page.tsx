"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Eye, EyeOff,
  AlertCircle, CheckCircle, Mail, ChevronDown,
  Briefcase, Globe, Award,
} from "lucide-react";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";

type Step = "form" | "confirm";

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", label: "US/CA" },
  { code: "+91", flag: "🇮🇳", label: "IN" },
];

const PERKS = [
  { icon: Briefcase, label: "Browse & apply for open roles" },
  { icon: Globe, label: "Track your applications in real-time" },
  { icon: Award, label: "Free to create an account" },
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
      <input type="tel" required value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} placeholder={prefix === "+1" ? "2025551234" : "9876543210"} maxLength={10} className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none" />
    </div>
  );
}

export default function SignUpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPw] = useState("");
  const [showPassword, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isConfirming, setConfirming] = useState(false);
  const [resendCooldown, setResend] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (isAuthenticated) router.push("/dashboard"); }, [isAuthenticated, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResend((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#1d4ed8]" />
      </div>
    );
  }

  const passwordsMatch = confirmPassword === "" || password === confirmPassword;
  const fullCode = code.join("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (phoneNumber.length !== 10) { setError("Enter a valid 10-digit phone number."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone: `${phonePrefix}${phoneNumber}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed.");
      setStep("confirm");
      setResend(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) codeRefs.current[index - 1]?.focus();
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setCode(pasted.split("")); codeRefs.current[5]?.focus(); }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length !== 6) return;
    setError(null);
    setConfirming(true);
    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirmation failed.");
      router.push("/auth/signin?confirmed=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Confirmation failed. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResend(60);
    const res = await fetch("/api/auth/confirm", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to resend code.");
    }
  };

  // ── Confirm step ──────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="w-full max-w-md overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-10 shadow-[0_24px_80px_-24px_rgba(29,78,216,0.2)]">
          <div className="mb-7 flex justify-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#1d4ed8]">
              <Mail className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="mb-2 text-center text-[1.5rem] text-gray-900" style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.02em" }}>Check your email</h2>
          <p className="mb-8 text-center text-sm text-gray-500">
            We sent a 6-digit code to <span className="font-semibold text-gray-800">{email}</span>
          </p>

          <form onSubmit={handleConfirm} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input key={i} ref={(el) => { codeRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleCodeChange(i, e.target.value)} onKeyDown={(e) => handleCodeKeyDown(i, e)} className="h-[52px] w-11 rounded-lg border border-gray-200 bg-gray-50/70 text-center text-lg font-semibold text-gray-900 outline-none transition focus:border-[#1d4ed8] focus:bg-white focus:ring-2 focus:ring-[#dbe6fe]" />
              ))}
            </div>

            <button type="submit" disabled={isConfirming || fullCode.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d4ed8] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1740ad] disabled:cursor-not-allowed disabled:opacity-60" style={{ fontFamily: "var(--font-display)" }}>
              {isConfirming ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCircle className="h-4 w-4" />}
              {isConfirming ? "Verifying…" : "Verify email"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Didn&apos;t receive it?{" "}
            <button type="button" onClick={handleResend} disabled={resendCooldown > 0} className="font-semibold text-[#1d4ed8] transition-colors hover:text-[#1740ad] disabled:cursor-not-allowed disabled:opacity-50">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </p>
          <p className="mt-3 text-center text-sm text-gray-400">
            Wrong email?{" "}
            <button type="button" onClick={() => { setStep("form"); setCode(["", "", "", "", "", ""]); setError(null); }} className="text-[#1d4ed8] hover:underline">Go back</button>
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Sign-up form ──────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Image half */}
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
              Join us today.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
              Create your account and start exploring career opportunities with one of the industry&apos;s leading staffing firms.
            </p>
            <div className="mt-9 space-y-3.5">
              {PERKS.map(({ icon: Icon, label }, i) => (
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

      {/* Form half */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mb-6 lg:hidden">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mx-auto w-full max-w-[400px]">
          <div className="mb-6 flex justify-center lg:hidden">
            <Image src="/logo.png" alt="Ocean Blue" width={140} height={32} className="h-7 w-auto" />
          </div>

          <h1 className="mb-1.5 text-[1.8rem] tracking-tight text-gray-900" style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.025em" }}>
            Create account
          </h1>
          <p className="mb-7 text-sm text-gray-500">Join Ocean Blue and unlock your next opportunity.</p>

          <form onSubmit={handleSignUp} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-[13px] font-medium text-gray-600">Full name</label>
              <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-medium text-gray-600">Email address</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-gray-600">Phone number</label>
              <PhoneInput value={phoneNumber} onChange={setPhoneNumber} prefix={phonePrefix} onPrefixChange={setPhonePrefix} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[13px] font-medium text-gray-600">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" className={`${inputClass} pr-11`} />
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
                      : confirmPassword && password === confirmPassword
                      ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                      : "border-gray-200 focus:border-[#1d4ed8] focus:ring-[#dbe6fe]"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!passwordsMatch && <p className="text-[11px] text-red-500">Passwords do not match.</p>}
              {confirmPassword && passwordsMatch && password === confirmPassword && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle className="h-3 w-3" /> Passwords match</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d4ed8] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1740ad] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70" style={{ fontFamily: "var(--font-display)" }}>
              {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-semibold text-[#1d4ed8] transition-colors hover:text-[#1740ad]">Sign in</Link>
          </p>

          <p className="mt-8 text-center text-xs text-gray-400">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-[#1d4ed8] hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-[#1d4ed8] hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
