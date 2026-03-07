"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, ArrowLeft, Briefcase, Bell, Star, CheckCircle } from "lucide-react";

export default function SignUpPage() {
  const { isAuthenticated, isLoading, signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white relative overflow-hidden">
        <motion.div
          className="absolute top-20 -left-20 w-[400px] h-[400px] bg-cyan-100 rounded-full blur-3xl opacity-40"
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-[300px] h-[300px] bg-blue-100 rounded-full blur-3xl opacity-40"
        />
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-cyan-200 border-t-cyan-600"
          />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Briefcase, text: "Access to job applications", gradient: "from-blue-600 to-indigo-600" },
    { icon: Bell, text: "Track your application status", gradient: "from-cyan-600 to-blue-600" },
    { icon: Star, text: "Get personalized job recommendations", gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-white relative overflow-hidden px-4 py-12">
      {/* Animated background orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 -left-20 w-[500px] h-[500px] bg-cyan-100 rounded-full blur-3xl opacity-40"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-blue-100 rounded-full blur-3xl opacity-40"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -10, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100 rounded-full blur-3xl opacity-20"
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
          <div
           
            className="mb-8 text-center"
          >
          
            <h1 className="heading-subsection text-gray-900 mb-2">
              Create{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-medium">
                  Account
                </span>
               
              </span>
            </h1>
            <p className="text-gray-500">Join Ocean Blue Corporation</p>
          </div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-8 space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-4 group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-700">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Sign Up Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(6, 182, 212, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={signUp}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            Sign Up with Cognito
          </motion.button>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-sm text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Sign In Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent hover:from-cyan-700 hover:to-blue-700 transition-all"
              >
                Sign in
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
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-cyan-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-cyan-600 hover:underline">
            Privacy Policy
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
