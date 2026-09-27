import { isAdmin, jsonError, sameOrigin } from "@/lib/admin-auth";
import { getReservation, perthDate, SEAT_NOTIFICATION_DATE, sendReservationEmail } from "@/lib/reservations";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return jsonError("Admin access required", 403);
  if (!sameOrigin(request)) return jsonError("Invalid request origin", 403);

  let body: { type?: unknown };
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return jsonError("Invalid request", 400);
    body = parsed as typeof body;
  } catch {
    return jsonError("Invalid request", 400);
  }
  if (body.type !== "confirmation" && body.type !== "seat") return jsonError("Choose an email to retry", 400);
  if (body.type === "seat" && perthDate() < SEAT_NOTIFICATION_DATE) return jsonError("Seat emails are not available before 23 January 2027", 409);

  const { id } = await context.params;
  try {
    const result = await sendReservationEmail(id, body.type);
    const reservation = await getReservation(id);
    if (!reservation) return jsonError("Reservation not found", 404);
    if (result.skipped) return jsonError("This email is not eligible to send or is already being sent", 409);
    return Response.json({ reservation, sent: result.sent }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Email retry failed", cause);
    return jsonError("Could not retry this email. Please try again.", 503);
  }
}