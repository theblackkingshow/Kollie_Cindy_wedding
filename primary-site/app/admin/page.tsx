import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { env } from "cloudflare:workers";
import Dashboard from "./dashboard";
import type { Metadata } from "next";

export const dynamic="force-dynamic";
export const metadata: Metadata = { title: "Guest list", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const user=await requireChatGPTUser("/admin");
  const adminEmail=(env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL;
  if (!adminEmail || user.email.toLowerCase()!==adminEmail.toLowerCase()) return <main className="shell"><h1 className="headline">Access restricted</h1><p>This dashboard is available only to the wedding organiser.</p></main>;
  return <Dashboard/>;
}
