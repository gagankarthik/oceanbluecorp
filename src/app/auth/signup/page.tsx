"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle, Mail, ChevronDown } from "lucide-react";

type Step = "form" | "confirm";

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", label: "US/CA" },
  { code: "+91", flag: "🇮🇳", label: "IN" },
];

function PhoneInput({
  value,
  onChange,
  prefix,
  onPrefixChange,
}: {
  value: string;
  onChange: (v: string) => void;
  prefix: string;
  onPrefixChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = COUNTRY_CODES.find((c) => c.code === prefix) ?? COUNTRY_CODES[0];

  return (
    <div className="flex rounded-xl border border-gray-200 bg-gray-50 overflow-hidden focus-within:border-cyan-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-100 transition">
      {/* Prefix dropdown */}
      <div ref={ref} className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-3 text-sm text-gray-700 border-r border-gray-200 bg-transparent hover:bg-gray-100 transition-colors h-full"
        >
          <span>{selected.flag}</span>
          <span className="font-medium">{selected.code}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 z-20 w-36 rounded-xl border border-gray-100 bg-white shadow-lg py-1"
            >
              {COUNTRY_CODES.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => { onPrefixChange(c.code); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      c.code === prefix ? "text-blue-600 font-semibold" : "text-gray-700"
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                    <span className="text-gray-400 text-xs ml-auto">{c.label}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Number input */}
      <input
        type="tel"
        required
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder={prefix === "+1" ? "2025551234" : "9876543210"}
        maxLength={prefix === "+1" ? 10 : 10}
        className="flex-1 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
      />
    </div>
  );
}

export default function SignUpPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirm step
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 rounded-full border-4 border-cyan-100 border-t-cyan-600 animate-spin" />
      </div>
    );
  }

  // ── Password strength hint ───────────────────────────────────────
  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  // ── Step 1: Sign Up ──────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const expectedLength = phonePrefix === "+1" ? 10 : 10;
    if (phoneNumber.length !== expectedLength) {
      setError(`Enter a valid ${expectedLength}-digit phone number.`);
      return;
    }

    setIsSubmitting(true);
    const fullPhone = `${phonePrefix}${phoneNumber}`;

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed.");

      setStep("confirm");
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Confirm ──────────────────────────────────────────────
  const fullCode = code.join("");

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      codeRefs.current[5]?.focus();
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length !== 6) return;
    setError(null);
    setIsConfirming(true);

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
      setIsConfirming(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResendCooldown(60);
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

  // ── Shared background decorations ────────────────────────────────
  const Bg = () => (
    <>
      <motion.div
        animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 -left-24 w-[480px] h-[480px] bg-cyan-100 rounded-full blur-3xl opacity-40 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], x: [0, 15, 0], y: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute -bottom-24 -right-24 w-[400px] h-[400px] bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none"
      />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </>
  );

  // ── Confirm step ─────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white relative overflow-hidden px-4 py-12">
        <Bg />
        <div className="w-full max-w-md relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-white p-8 md:p-10 shadow-xl border border-gray-100"
          >
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Mail className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Check your email</h2>
            <p className="text-gray-500 text-center text-sm mb-8">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-gray-800">{email}</span>
            </p>

            <form onSubmit={handleConfirm} className="space-y-6">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
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
                    style={{ height: "3.25rem" }}
                    className="w-11 rounded-xl border border-gray-200 bg-gray-50 text-center text-lg font-semibold text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                ))}
              </div>

              <motion.button
                type="submit"
                disabled={isConfirming || fullCode.length !== 6}
                whileHover={{ scale: isConfirming ? 1 : 1.02 }}
                whileTap={{ scale: isConfirming ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
              >
                {isConfirming ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isConfirming ? "Verifying…" : "Verify email"}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </p>
            <p className="mt-3 text-center text-sm text-gray-400">
              Wrong email?{" "}
              <button
                type="button"
                onClick={() => { setStep("form"); setCode(["", "", "", "", "", ""]); setError(null); }}
                className="text-blue-600 hover:underline"
              >
                Go back
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Sign Up form ─────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-white relative overflow-hidden">
      <Bg />

      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-cyan-600 to-blue-600 p-12 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -15, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -left-24 w-[350px] h-[350px] bg-white/10 rounded-full blur-2xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute top-10 -right-10 w-[250px] h-[250px] bg-white/10 rounded-full blur-2xl pointer-events-none"
        />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-white leading-tight">
              Join Ocean Blue<br />
              <span className="text-white/80">Corporation</span>
            </h2>
            <p className="mt-4 text-white/70 text-lg leading-relaxed">
              Create your account and start exploring career opportunities with one of the industry&apos;s leading staffing firms.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            {[
              "Free to create an account",
              "Browse and apply for open roles",
              "Track your application status in real-time",
            ].map((text, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3 text-white/80 text-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                {text}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-xs">&copy; {new Date().getFullYear()} Ocean Blue Corporation</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center w-full lg:w-[55%] px-6 py-12 sm:px-12 relative z-10">
        <div className="lg:hidden mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
            <p className="text-gray-500 mb-8">Join Ocean Blue and unlock your next opportunity.</p>

            <form onSubmit={handleSignUp} className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Full name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  prefix={phonePrefix}
                  onPrefixChange={setPhonePrefix}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-gray-900 placeholder-gray-400 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">Must include uppercase, lowercase, number, and symbol.</p>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full rounded-xl border bg-gray-50 px-4 py-3 pr-11 text-gray-900 placeholder-gray-400 text-sm outline-none transition focus:bg-white focus:ring-2 ${
                      !passwordsMatch
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : confirmPassword && password === confirmPassword
                        ? "border-green-300 focus:border-green-400 focus:ring-green-100"
                        : "border-gray-200 focus:border-cyan-400 focus:ring-cyan-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!passwordsMatch && (
                  <p className="text-xs text-red-500">Passwords do not match.</p>
                )}
                {confirmPassword && passwordsMatch && password === confirmPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 mt-2"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isSubmitting ? "Creating account…" : "Create account"}
              </motion.button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
