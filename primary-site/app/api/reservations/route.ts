import { database, jsonError, sameOrigin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Invalid request origin", 403);

  let body: { fullName?: unknown; email?: unknown; phone?: unknown };
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return jsonError("Invalid request", 400);
    body = parsed as typeof body;
  } catch {
    return jsonError("Invalid request", 400);
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim().replace(/\s+/g, " ") : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!fullName || fullName.length > 120) return jsonError("Enter your full name", 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Enter a valid email address", 400);
  if (!phone || phone.length > 50) return jsonError("Enter your phone number", 400);

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  try {
    await database()`INSERT INTO reservations (id, full_name, email, phone, status, created_at, confirmation_email_sent, seat_email_sent) VALUES (${id}, ${fullName}, ${email}, ${phone}, ${"pending"}, ${createdAt}, ${false}, ${false})`;
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505") {
      return jsonError("A reservation has already been submitted with this email address.", 409);
    }
    console.error("Reservation submission failed", cause);
    return jsonError("Could not submit your reservation. Please try again.", 503);
  }
}