"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@/lib/auth/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, ShieldCheck, BarChart2, Users } from "lucide-react";
import Photo from "@/components/landing/Photo";
import { IMG } from "@/components/landing/media";

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

const FEATURES = [
  { icon: ShieldCheck, label: "Secure, role-based access" },
  { icon: BarChart2, label: "Real-time application tracking" },
  { icon: Users, label: "Centralized candidate management" },
];

type E4 = [number, number, number, number];
const ease: E4 = [0.16, 1, 0.3, 1];
const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-[#1d4ed8] focus:bg-white focus:ring-2 focus:ring-[#dbe6fe]";

export default function SignInPage() {
  const { isAuthenticated, isLoading, user, signInWithCredentials } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPw] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const authUser = await signInWithCredentials(email, password);
      router.push(getRoleRedirect(authUser.role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
              Welcome back.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
              Sign in to manage applications, track hiring progress, and connect with top talent.
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

      {/* Form half */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to home
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mx-auto w-full max-w-[380px]">
          <div className="mb-7 flex justify-center lg:hidden">
            <Image src="/logo.png" alt="Ocean Blue" width={140} height={32} className="h-7 w-auto" />
          </div>

          <h1 className="mb-1.5 text-[1.9rem] tracking-tight text-gray-900" style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.025em" }}>
            Sign in
          </h1>
          <p className="mb-8 text-sm text-gray-500">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

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

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-semibold text-[#1d4ed8] transition-colors hover:text-[#1740ad]">Sign up</Link>
          </p>

          <p className="mt-10 text-center text-xs text-gray-400">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-[#1d4ed8] hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-[#1d4ed8] hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
