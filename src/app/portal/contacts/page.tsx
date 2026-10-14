import type { Metadata } from "next";
import ContactsView from "./ContactsView";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return <ContactsView />;
}
