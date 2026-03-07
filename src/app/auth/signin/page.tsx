"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, ArrowLeft, Shield, Zap, Users } from "lucide-react";

const FloatingOrb = ({ className = "", delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 0.15, scale: 1 }}
    transition={{ duration: 1.5, delay }}
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
  />
);

export default function SignInPage() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white relative overflow-hidden">
        <FloatingOrb className="top-20 -left-20 w-[400px] h-[400px] bg-blue-200" delay={0} />
        <FloatingOrb className="bottom-20 -right-20 w-[300px] h-[300px] bg-cyan-200" delay={0.2} />
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white relative overflow-hidden px-4 py-12">
      {/* Animated background orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 -right-20 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-40"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-cyan-100 rounded-full blur-3xl opacity-40"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 10, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-3xl opacity-20"
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-white p-8 md:p-10 shadow-xl border border-gray-100"
        >
          {/* Logo */}
          <div className="mb-8 text-center"
          >
            <h1 className="heading-subsection text-gray-900 mb-2">
              Welcome{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                  Back
                </span>
              </span>
            </h1>
            <p className="text-gray-500">Sign in to your Ocean Blue account</p>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-8 space-y-3"
          >
            {[
              { icon: Shield, text: "Secure authentication" },
              { icon: Zap, text: "Quick access to dashboard" },
              { icon: Users, text: "Manage your applications" },
            ].map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 text-gray-600"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Sign In Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(37, 99, 235, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={signIn}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign In with Cognito
          </motion.button>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-sm text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-cyan-700 transition-all"
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center text-sm text-gray-400"
        >
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
