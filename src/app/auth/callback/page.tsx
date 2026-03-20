"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserManager } from "@/lib/auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Shield, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

type AuthStatus = "verifying" | "success" | "error" | "email_verified";

export default function CallbackPage() {
  const [status, setStatus] = useState<AuthStatus>("verifying");
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have the required OAuth parameters in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");

        // If no code or state, this might be an email verification redirect
        // or direct navigation - redirect to sign in
        if (!code || !state) {
          console.log("No OAuth parameters found, redirecting to sign in...");
          // Show a friendly message for email verification
          setStatus("email_verified");
          setError(null);
          // Redirect to sign in after showing success message
          setTimeout(() => {
            router.push("/auth/signin");
          }, 3000);
          return;
        }

        const userManager = getUserManager();

        // Process the callback - this will exchange the code for tokens
        const user = await userManager.signinRedirectCallback();

        if (user) {
          // Get user role from groups
          const groups = (user.profile as Record<string, unknown>)["cognito:groups"] as string[] || [];

          // Determine role for display
          if (groups.includes("admin")) {
            setUserRole("Administrator");
          } else if (groups.includes("hr")) {
            setUserRole("HR Manager");
          } else if (groups.includes("recruiter")) {
            setUserRole("Recruiter");
          } else {
            setUserRole("User");
          }

          setStatus("success");

          // Redirect after a brief delay to show success state
          setTimeout(() => {
            if (groups.includes("admin")) {
              router.push("/admin");
            } else if (groups.includes("hr")) {
              router.push("/admin/applications");
            } else if (groups.includes("recruiter")) {
              router.push("/admin/jobs");
            } else {
              router.push("/dashboard");
            }
          }, 2000);
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Callback error:", err);
        const errorMessage = err instanceof Error ? err.message : "Authentication failed";

        // Handle specific errors gracefully
        if (errorMessage.includes("No state in response") || errorMessage.includes("state")) {
          // This usually means the user came from email verification
          // Redirect them to sign in
          setStatus("error");
          setError("Please sign in to continue after verifying your email.");
        } else {
          setStatus("error");
          setError(errorMessage);
        }
      }
    };

    handleCallback();
  }, [router]);

  const steps = [
    { label: "Verifying credentials", completed: status !== "verifying" },
    { label: "Exchanging tokens", completed: status === "success" || status === "error" },
    { label: "Setting up session", completed: status === "success" },
  ];

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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-3xl opacity-20"
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-white p-8 md:p-10 shadow-xl border border-gray-100"
        >
          <AnimatePresence mode="wait">
            {/* Verifying State */}
            {status === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Shield className="h-10 w-10 text-white" />
                  </motion.div>
                </motion.div>

                <h1 className="heading-subsection text-gray-900 mb-3">
                  Verifying{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Identity
                  </span>
                </h1>
                <p className="text-gray-500 mb-8">Please wait while we complete authentication</p>

                {/* Progress Steps */}
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        step.completed
                          ? "bg-emerald-100"
                          : "bg-gray-100"
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-5 h-5 text-gray-400" />
                          </motion.div>
                        )}
                      </div>
                      <span className={`text-sm ${step.completed ? "text-gray-900" : "text-gray-500"}`}>
                        {step.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Success State */}
            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg"
                >
                  <CheckCircle className="h-10 w-10 text-white" />
                </motion.div>

                <h1 className="heading-subsection text-gray-900 mb-3">
                  Welcome{" "}
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    Back!
                  </span>
                </h1>
                <p className="text-gray-500 mb-2">Authentication successful</p>
                {userRole && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-gray-400 mb-6"
                  >
                    Signed in as <span className="font-medium text-gray-600">{userRole}</span>
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 text-emerald-600"
                >
                  <span className="text-sm font-medium">Redirecting to dashboard</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* Email Verified State */}
            {status === "email_verified" && (
              <motion.div
                key="email_verified"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg"
                >
                  <CheckCircle className="h-10 w-10 text-white" />
                </motion.div>

                <h1 className="heading-subsection text-gray-900 mb-3">
                  Email{" "}
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    Verified!
                  </span>
                </h1>
                <p className="text-gray-500 mb-6">Your email has been verified successfully. Please sign in to continue.</p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 text-emerald-600"
                >
                  <span className="text-sm font-medium">Redirecting to sign in</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* Error State */}
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg"
                >
                  <XCircle className="h-10 w-10 text-white" />
                </motion.div>

                <h1 className="heading-subsection text-gray-900 mb-3">
                  Authentication{" "}
                  <span className="bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
                    Failed
                  </span>
                </h1>
                <p className="text-gray-500 mb-2">We couldn&apos;t complete the sign in process</p>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-6"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="space-y-3">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/auth/signin")}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-white font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </motion.button>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Link
                      href="/"
                      className="inline-block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Return to Home
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
