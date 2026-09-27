import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
export type Guest = {id:string;code:string;name:string;seats:number;status:"pending"|"yes"|"no";attendees:number;updated_at:string};
export function database() { if (!env.DB) throw new Error("Guest database unavailable"); return env.DB; }
export async function isAdmin() {
  const user = await getChatGPTUser();
  const adminEmail = (env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL;
  return Boolean(adminEmail && user?.email.toLowerCase() === adminEmail.toLowerCase());
}
export function sameOrigin(request: Request) { const origin = request.headers.get("origin"); return Boolean(origin && origin === new URL(request.url).origin); }
export function newCode() { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join(""); }
export function jsonError(message:string,status:number) { return Response.json({error:message},{status,headers:{"Cache-Control":"no-store"}}); }
