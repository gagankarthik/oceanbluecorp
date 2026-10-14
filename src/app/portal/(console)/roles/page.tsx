import { redirect } from "next/navigation";

// Roles live on Users → Roles & permissions.
export default function RolesPage() {
  redirect("/portal/users?tab=roles");
}
