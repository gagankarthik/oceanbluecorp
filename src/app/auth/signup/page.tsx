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

type Step = "form" | "confirm";

const COUNTRY_CODES = [
  { code: "+1",  flag: "🇺🇸", label: "US/CA" },
  { code: "+91", flag: "🇮🇳", label: "IN" },
];

const PAGE_BG = [
  "radial-gradient(ellipse 70% 60% at 85% 15%, rgba(6,182,212,0.1) 0%, transparent 55%)",
  "radial-gradient(ellipse 60% 50% at 12% 75%, rgba(99,102,241,0.09) 0%, transparent 55%)",
  "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 55%)",
  "#F4F7FF",
].join(", ");

const PERKS = [
  { icon: Briefcase, label: "Browse & apply for open roles" },
  { icon: Globe,     label: "Track your applications in real-time" },
  { icon: Award,     label: "Free to create an account" },
];

type E4 = [number, number, number, number];
const ease: E4 = [0.16, 1, 0.3, 1];

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
    <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50/70 transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
      <div ref={ref} className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-full items-center gap-1.5 border-r border-gray-200 bg-transparent px-3 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-100"
        >
          <span>{selected.flag}</span>
          <span className="font-medium">{selected.code}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-20 mt-1 w-36 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
            >
              {COUNTRY_CODES.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => { onPrefixChange(c.code); setOpen(false); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${c.code === prefix ? "font-semibold text-indigo-600" : "text-gray-700"}`}
                  >
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
      <input
        type="tel"
        required
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder={prefix === "+1" ? "2025551234" : "9876543210"}
        maxLength={10}
        className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
      />
    </div>
  );
}

export default function SignUpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");

  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [phonePrefix, setPhonePrefix]       = useState("+1");
  const [phoneNumber, setPhoneNumber]       = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPw]     = useState("");
  const [showPassword, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [isSubmitting, setSubmitting]       = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const [code, setCode]               = useState(["", "", "", "", "", ""]);
  const [isConfirming, setConfirming] = useState(false);
  const [resendCooldown, setResend]   = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (isAuthenticated) router.push("/dashboard"); }, [isAuthenticated, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResend((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: PAGE_BG }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-500" />
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
      <div
        className="flex min-h-screen items-center justify-center p-4 sm:p-8"
        style={{ background: PAGE_BG }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-10"
          style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 24px 80px rgba(99,102,241,0.12)" }}
        >
          <div className="mb-7 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, #4338ca, #38bdf8)" }}
            >
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2
            className="mb-2 text-center text-[1.5rem] text-gray-900"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Check your email
          </h2>
          <p className="mb-8 text-center text-sm text-gray-500">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-gray-800">{email}</span>
          </p>

          <form onSubmit={handleConfirm} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="h-[52px] w-11 rounded-xl border border-gray-200 bg-gray-50/70 text-center text-lg font-semibold text-gray-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              ))}
            </div>

            <motion.button
              type="submit"
              disabled={isConfirming || fullCode.length !== 6}
              whileHover={{ scale: isConfirming ? 1 : 1.015 }}
              whileTap={{ scale: isConfirming ? 1 : 0.985 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #4338ca 0%, #6366f1 55%, #38bdf8 100%)",
                boxShadow: "0 4px 18px rgba(99,102,241,0.38)",
                fontFamily: "var(--font-display)",
              }}
            >
              {isConfirming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {isConfirming ? "Verifying…" : "Verify email"}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </p>
          <p className="mt-3 text-center text-sm text-gray-400">
            Wrong email?{" "}
            <button
              type="button"
              onClick={() => { setStep("form"); setCode(["", "", "", "", "", ""]); setError(null); }}
              className="text-indigo-600 hover:underline"
            >
              Go back
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Sign-up form ──────────────────────────────────────────
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 sm:p-8"
      style={{ background: PAGE_BG }}
    >
      {/* Grain */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.022,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease }}
        className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white"
        style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 24px 80px rgba(99,102,241,0.12)" }}
      >
        <div className="flex">

          {/* ── Brand panel ── */}
          <div
            className="relative hidden w-[50%] flex-col justify-between overflow-hidden p-10 lg:flex"
            style={{ background: "linear-gradient(145deg, #0891b2 0%, #6366f1 50%, #4338ca 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: [
                  "radial-gradient(ellipse 80% 60% at 80% 5%, rgba(255,255,255,0.16) 0%, transparent 55%)",
                  "radial-gradient(ellipse 60% 50% at 10% 90%, rgba(255,255,255,0.1) 0%, transparent 55%)",
                ].join(", "),
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>

            <div className="relative z-10 space-y-7">
              <div>
                <p
                  className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Ocean Blue Corporation
                </p>
                <h2
                  className="text-white"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2rem", lineHeight: 1.08, letterSpacing: "-0.025em" }}
                >
                  Join us today.
                </h2>
                <p
                  className="mt-1.5 text-[1.45rem] leading-snug text-white/70"
                  style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                >
                  Your next opportunity awaits.
                </p>
                <p className="mt-4 text-[13px] leading-relaxed text-white/55">
                  Create your account and start exploring career opportunities with one of the industry&apos;s leading staffing firms.
                </p>
              </div>

              <div className="space-y-3">
                {PERKS.map(({ icon: Icon, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, ease }}
                    className="flex items-center gap-3 text-[13px] text-white/70"
                  >
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "rgba(255,255,255,0.12)" }}
                    >
                      <Icon className="h-3.5 w-3.5 text-white/80" />
                    </div>
                    {label}
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="relative z-10 text-[11px] text-white/30">
              &copy; {new Date().getFullYear()} Ocean Blue Corporation
            </p>
          </div>

          {/* ── Form panel ── */}
          <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-12">

            <div className="mb-6 lg:hidden">
              <Link href="/" className="group inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Back to Home
              </Link>
            </div>

            <div className="mx-auto w-full max-w-[360px]">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease }}
              >
                <div className="mb-6 flex justify-center lg:hidden">
                  <Image src="/logo.png" alt="Ocean Blue" width={140} height={32} className="h-7 w-auto" />
                </div>

                <h1
                  className="mb-1.5 text-[1.65rem] text-gray-900"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.025em" }}
                >
                  Create account
                </h1>
                <p className="mb-7 text-sm text-gray-500">
                  Join Ocean Blue and unlock your next opportunity.
                </p>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-[13px] font-medium text-gray-600">Full name</label>
                    <input
                      id="name" type="text" autoComplete="name" required
                      value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[13px] font-medium text-gray-600">Email address</label>
                    <input
                      id="email" type="email" autoComplete="email" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-gray-600">Phone number</label>
                    <PhoneInput
                      value={phoneNumber} onChange={setPhoneNumber}
                      prefix={phonePrefix} onPrefixChange={setPhonePrefix}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-[13px] font-medium text-gray-600">Password</label>
                    <div className="relative">
                      <input
                        id="password" type={showPassword ? "text" : "password"}
                        autoComplete="new-password" required minLength={8}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                      <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">Uppercase, lowercase, number, and symbol required.</p>
                  </div>

                  {/* Confirm */}
                  <div className="space-y-1.5">
                    <label htmlFor="confirmPw" className="block text-[13px] font-medium text-gray-600">Confirm password</label>
                    <div className="relative">
                      <input
                        id="confirmPw" type={showConfirm ? "text" : "password"}
                        autoComplete="new-password" required
                        value={confirmPassword} onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Re-enter your password"
                        className={`w-full rounded-xl border bg-gray-50/70 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:bg-white focus:ring-2 ${
                          !passwordsMatch
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : confirmPassword && password === confirmPassword
                            ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                            : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100"
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!passwordsMatch && <p className="text-[11px] text-red-500">Passwords do not match.</p>}
                    {confirmPassword && passwordsMatch && password === confirmPassword && (
                      <p className="flex items-center gap-1 text-[11px] text-emerald-600">
                        <CheckCircle className="h-3 w-3" /> Passwords match
                      </p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.015 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.985 }}
                    className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    style={{
                      background: "linear-gradient(135deg, #0891b2 0%, #6366f1 55%, #4338ca 100%)",
                      boxShadow: "0 4px 18px rgba(99,102,241,0.38)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Creating account…" : "Create account"}
                  </motion.button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-indigo-500 hover:underline">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</Link>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
