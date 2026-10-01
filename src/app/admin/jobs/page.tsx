import { redirect } from "next/navigation";

// The list moved to /admin/state-roles; old links and bookmarks still land on it.
export default function JobsIndexRedirect() {
  redirect("/admin/state-roles");
}
