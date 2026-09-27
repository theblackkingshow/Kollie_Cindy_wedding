import { isAdmin, jsonError } from "@/lib/admin-auth";
import { listReservations } from "@/lib/reservations";

export async function GET() {
  if (!(await isAdmin())) return jsonError("Admin access required", 403);
  try {
    const reservations = await listReservations();
    return Response.json({ reservations }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Reservation list unavailable", cause);
    return jsonError("Reservation list unavailable. Please try again.", 503);
  }
}