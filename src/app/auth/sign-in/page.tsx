import type { Metadata } from "next";
import AuthShell from "../AuthShell";
import SignInForm from "./SignInForm";

export const metadata: Metadata = {
  title: "Employee sign in",
  description: "Sign in to the Oceanblue employee portal.",
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
