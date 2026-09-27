import { isAdmin } from "@/lib/guests";
import Dashboard from "./dashboard";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic="force-dynamic";
export const metadata: Metadata = { title: "Guest list", robots: { index: false, follow: false } };
export default async function AdminPage() {
  if (!(await isAdmin())) return <main className="shell"><h1 className="headline">Access restricted</h1><p>This dashboard is available only to the wedding organiser.</p><p><Link href="/admin/login">Sign in</Link></p></main>;
  return <Dashboard/>;
}
