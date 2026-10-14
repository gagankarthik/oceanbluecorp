import type { Metadata } from "next";
import UsersView from "./UsersView";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <UsersView initialTab={tab === "roles" ? "roles" : "users"} />;
}
