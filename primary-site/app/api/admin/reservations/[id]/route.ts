import { database, isAdmin, jsonError, sameOrigin } from "@/lib/admin-auth";
import { getReservation, sendReservationEmail } from "@/lib/reservations";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return jsonError("Admin access required", 403);
  if (!sameOrigin(request)) return jsonError("Invalid request origin", 403);

  const { id } = await context.params;
  let body: { status?: unknown; seatNumber?: unknown; fullName?: unknown; email?: unknown; phone?: unknown };
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return jsonError("Invalid request", 400);
    body = parsed as typeof body;
  } catch {
    return jsonError("Invalid request", 400);
  }

  try {
    let sendConfirmation = false;
    if (body.status === "approved") {
      const updated = await database()`UPDATE reservations SET status='approved', approved_at=${new Date().toISOString()} WHERE id=${id} AND status='pending' RETURNING id`;
      sendConfirmation = updated.length > 0;
      if (!sendConfirmation) {
        const current = await getReservation(id);
        if (!current) return jsonError("Reservation not found", 404);
        if (current.status !== "approved") return jsonError("Only pending reservations can be approved", 409);
      }
    } else if (body.status === "rejected") {
      const updated = await database()`UPDATE reservations SET status='rejected' WHERE id=${id} AND status='pending' RETURNING id`;
      if (!updated.length) {
        const current = await getReservation(id);
        if (!current) return jsonError("Reservation not found", 404);
        if (current.status !== "rejected") return jsonError("Only pending reservations can be rejected", 409);
      }
    } else if (body.seatNumber !== undefined) {
      const seatNumber = body.seatNumber === null || body.seatNumber === "" ? null : typeof body.seatNumber === "string" ? body.seatNumber.trim() : undefined;
      if (seatNumber === undefined || (seatNumber !== null && (!seatNumber || seatNumber.length > 32))) return jsonError("Enter a valid seat number", 400);
      const updated = await database()`UPDATE reservations SET seat_number=${seatNumber} WHERE id=${id} AND status='approved' RETURNING id`;
      if (!updated.length) {
        const current = await getReservation(id);
        if (!current) return jsonError("Reservation not found", 404);
        return jsonError("A seat can only be assigned to an approved reservation", 409);
      }
    } else if (body.fullName !== undefined || body.email !== undefined || body.phone !== undefined) {
      const current = await getReservation(id);
      if (!current) return jsonError("Reservation not found", 404);
      const fullName = body.fullName === undefined ? current.fullName : typeof body.fullName === "string" ? body.fullName.trim().replace(/\s+/g, " ") : "";
      const email = body.email === undefined ? current.email : typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const phone = body.phone === undefined ? current.phone : typeof body.phone === "string" ? body.phone.trim() : "";
      if (!fullName || fullName.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || phone.length > 50) return jsonError("Check the guest name, email, and phone number", 400);
      await database()`UPDATE reservations SET full_name=${fullName}, email=${email}, phone=${phone} WHERE id=${id}`;
    } else {
      return jsonError("Choose an update to make", 400);
    }

    if (sendConfirmation) await sendReservationEmail(id, "confirmation");
    const reservation = await getReservation(id);
    if (!reservation) return jsonError("Reservation not found", 404);
    return Response.json({ reservation }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505") {
      const constraint = "constraint" in cause ? cause.constraint : undefined;
      return constraint === "idx_reservations_email_lower"
        ? jsonError("That email address is already used by another reservation", 409)
        : jsonError("That seat number is already assigned", 409);
    }
    console.error("Reservation update failed", cause);
    return jsonError("Could not update this reservation. Please try again.", 503);
  }
}