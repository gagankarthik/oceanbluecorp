import type { Metadata } from "next";
import ClientsView from "./ClientsView";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return <ClientsView />;
}
