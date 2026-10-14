import { redirect } from "next/navigation";

// Keys are managed on Developer.
export default function ApiKeysPage() {
  redirect("/portal/developer");
}
