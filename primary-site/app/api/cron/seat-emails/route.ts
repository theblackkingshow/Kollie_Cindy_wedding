import { database, jsonError } from "@/lib/admin-auth";
import { SEAT_NOTIFICATION_DATE, sendReservationEmail, perthDate } from "@/lib/reservations";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return jsonError("Scheduled email delivery is not configured", 503);
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return jsonError("Unauthorized", 401);
  if (perthDate() < SEAT_NOTIFICATION_DATE) return Response.json({ ok: true, sent: 0, skipped: "not scheduled yet" });

  try {
    const reservations = await database()`SELECT id FROM reservations WHERE status='approved' AND seat_number IS NOT NULL AND seat_email_sent=FALSE ORDER BY created_at` as { id: string }[];
    let sent = 0;
    let failed = 0;
    for (let index = 0; index < reservations.length; index += 10) {
      const batch = reservations.slice(index, index + 10);
      const results = await Promise.all(batch.map(reservation => sendReservationEmail(reservation.id, "seat")));
      sent += results.filter(result => result.sent).length;
      failed += results.filter(result => !result.sent && !result.skipped).length;
    }
    return Response.json({ ok: true, sent, failed }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Seat email job failed", cause);
    return jsonError("Seat email job failed", 503);
  }
}