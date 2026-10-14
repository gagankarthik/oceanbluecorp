import type { Metadata } from "next";
import AuthShell from "../AuthShell";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell back={{ href: "/auth/sign-in", label: "Back to sign in" }}>
      <ForgotForm />
    </AuthShell>
  );
}
