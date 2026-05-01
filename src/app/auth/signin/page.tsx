"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@/lib/auth/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, ShieldCheck, BarChart2, Users } from "lucide-react";

function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.HR:
    case UserRole.RECRUITER:
    case UserRole.SALES:
      return "/admin";
    default:
      return "/dashboard";
  }
}

const PAGE_BG = [
  "radial-gradient(ellipse 70% 60% at 15% 20%, rgba(99,102,241,0.1) 0%, transparent 55%)",
  "radial-gradient(ellipse 60% 50% at 88% 70%, rgba(6,182,212,0.08) 0%, transparent 55%)",
  "radial-gradient(ellipse 55% 45% at 50% 95%, rgba(168,85,247,0.06) 0%, transparent 55%)",
  "#F4F7FF",
].join(", ");

const FEATURES = [
  { icon: ShieldCheck, label: "Secure, role-based access" },
  { icon: BarChart2,   label: "Real-time application tracking" },
  { icon: Users,       label: "Centralized candidate management" },
];

type E4 = [number, number, number, number];
const ease: E4 = [0.16, 1, 0.3, 1];

export default function SignInPage() {
  const { isAuthenticated, isLoading, user, signInWithCredentials } = useAuth();
  const router = useRouter();

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPw]     = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) router.push(getRoleRedirect(user.role));
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: PAGE_BG }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-500" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const authUser = await signInWithCredentials(email, password);
      router.push(getRoleRedirect(authUser.role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 sm:p-8"
      style={{ background: PAGE_BG }}
    >
      {/* Grain texture */}
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
        <div className="flex min-h-[650px]">

          {/* ── Brand panel ── */}
          <div
            className="relative hidden w-[50%] flex-col justify-between overflow-hidden p-10 lg:flex"
            style={{ background: "linear-gradient(145deg, #4338ca 0%, #6366f1 50%, #38bdf8 100%)" }}
          >
            {/* Mesh */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: [
                  "radial-gradient(ellipse 80% 60% at 20% 8%, rgba(255,255,255,0.18) 0%, transparent 55%)",
                  "radial-gradient(ellipse 60% 50% at 90% 90%, rgba(255,255,255,0.1) 0%, transparent 55%)",
                ].join(", "),
              }}
            />
            {/* Dot grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            {/* Back link */}
            <div className="relative z-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>

            {/* Headline */}
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
                  Welcome back.
                </h2>
                <p
                  className="mt-1.5 text-[1.45rem] leading-snug text-white/70"
                  style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                >
                  Where talent meets opportunity.
                </p>
                <p className="mt-4 text-[13px] leading-relaxed text-white/55">
                  Sign in to manage applications, track hiring progress, and connect with top talent.
                </p>
              </div>

              <div className="space-y-3">
                {FEATURES.map(({ icon: Icon, label }, i) => (
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
          <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12">

            {/* Mobile back */}
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Back to Home
              </Link>
            </div>

            <div className="mx-auto w-full max-w-[340px]">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease }}
              >
                {/* Logo (mobile) */}
                <div className="mb-7 flex justify-center lg:hidden">
                  <Image src="/logo.png" alt="Ocean Blue" width={140} height={32} className="h-7 w-auto" />
                </div>

                <h1
                  className="mb-1.5 text-[1.75rem] text-gray-900"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.025em" }}
                >
                  Sign in
                </h1>
                <p className="mb-8 text-sm text-gray-500">
                  Enter your credentials to continue.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[13px] font-medium text-gray-600">
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
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-[13px] font-medium text-gray-600">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.015 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.985 }}
                    className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-70"
                    style={{
                      background: "linear-gradient(135deg, #4338ca 0%, #6366f1 55%, #38bdf8 100%)",
                      boxShadow: "0 4px 18px rgba(99,102,241,0.38)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Signing in…" : "Sign in"}
                  </motion.button>
                </form>

                <div className="my-7 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <p className="text-center text-sm text-gray-500">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/signup"
                    className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                  >
                    Sign up
                  </Link>
                </p>
              </motion.div>
            </div>

            <p className="mt-10 text-center text-xs text-gray-400">
              By signing in, you agree to our{" "}
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
