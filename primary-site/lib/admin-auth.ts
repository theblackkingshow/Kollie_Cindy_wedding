import postgres from "postgres";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL;
const adminPassword = process.env.ADMIN_PASSWORD;
const authSecret = process.env.AUTH_SECRET;
let sql: ReturnType<typeof postgres> | undefined;

export function database() {
  if (!databaseUrl) throw new Error("Reservation database unavailable: set DATABASE_URL");
  return sql ??= postgres(databaseUrl, { prepare: false });
}

export async function isAdmin() {
  if (!adminPassword || !authSecret) return false;
  const token = (await cookies()).get("wedding_admin")?.value;
  if (!token) return false;
  const expected = createHmac("sha256", authSecret).update(adminPassword).digest("hex");
  return token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function validAdminPassword(password: string) {
  if (!adminPassword) return false;
  const submitted = Buffer.from(password);
  const expected = Buffer.from(adminPassword);
  return submitted.length === expected.length && timingSafeEqual(submitted, expected);
}

export function adminSessionToken() {
  if (!adminPassword || !authSecret) throw new Error("Admin authentication is not configured");
  return createHmac("sha256", authSecret).update(adminPassword).digest("hex");
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}