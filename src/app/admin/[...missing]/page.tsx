import { notFound } from "next/navigation";

// Unknown /admin/* URLs would otherwise fall through to the public 404,
// outside the shell. Throwing here renders admin/not-found.tsx instead.
export default function MissingAdminRoute() {
  notFound();
}
