import { database } from "@/lib/admin-auth";
import { sendWeddingEmail } from "@/lib/email";

export type ReservationStatus = "pending" | "approved" | "rejected";
export type Reservation = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: ReservationStatus;
  createdAt: string;
  approvedAt: string | null;
  seatNumber: string | null;
  confirmationEmailSent: boolean;
  confirmationEmailSentAt: string | null;
  confirmationEmailError: string | null;
  seatEmailSent: boolean;
  seatEmailSentAt: string | null;
  seatEmailError: string | null;
};

type DatabaseReservation = Omit<Reservation, "createdAt" | "approvedAt" | "confirmationEmailSentAt" | "seatEmailSentAt"> & {
  createdAt: string | Date;
  approvedAt: string | Date | null;
  confirmationEmailSentAt: string | Date | null;
  seatEmailSentAt: string | Date | null;
};

function iso(value: string | Date | null) {
  return value === null ? null : value instanceof Date ? value.toISOString() : value;
}

function formatReservation(row: DatabaseReservation): Reservation {
  return {
    ...row,
    createdAt: iso(row.createdAt) ?? "",
    approvedAt: iso(row.approvedAt),
    confirmationEmailSentAt: iso(row.confirmationEmailSentAt),
    seatEmailSentAt: iso(row.seatEmailSentAt),
  };
}

export async function listReservations() {
  const rows = await database()`SELECT id, full_name AS "fullName", email, phone, status, created_at AS "createdAt", approved_at AS "approvedAt", seat_number AS "seatNumber", confirmation_email_sent AS "confirmationEmailSent", confirmation_email_sent_at AS "confirmationEmailSentAt", confirmation_email_error AS "confirmationEmailError", seat_email_sent AS "seatEmailSent", seat_email_sent_at AS "seatEmailSentAt", seat_email_error AS "seatEmailError" FROM reservations ORDER BY created_at DESC` as DatabaseReservation[];
  return rows.map(formatReservation);
}

export async function getReservation(id: string) {
  const [row] = await database()`SELECT id, full_name AS "fullName", email, phone, status, created_at AS "createdAt", approved_at AS "approvedAt", seat_number AS "seatNumber", confirmation_email_sent AS "confirmationEmailSent", confirmation_email_sent_at AS "confirmationEmailSentAt", confirmation_email_error AS "confirmationEmailError", seat_email_sent AS "seatEmailSent", seat_email_sent_at AS "seatEmailSentAt", seat_email_error AS "seatEmailError" FROM reservations WHERE id=${id}` as DatabaseReservation[];
  return row ? formatReservation(row) : null;
}

export const SEAT_NOTIFICATION_DATE = "2027-01-23";

export function perthDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Perth", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export async function sendReservationEmail(id: string, type: "confirmation" | "seat") {
  const now = new Date().toISOString();
  const expiredClaim = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const row = type === "confirmation"
    ? (await database()`UPDATE reservations SET confirmation_email_sending_at=${now}, confirmation_email_error=NULL WHERE id=${id} AND status='approved' AND confirmation_email_sent=FALSE AND (confirmation_email_sending_at IS NULL OR confirmation_email_sending_at < ${expiredClaim}) RETURNING full_name, email`)[0]
    : (await database()`UPDATE reservations SET seat_email_sending_at=${now}, seat_email_error=NULL WHERE id=${id} AND status='approved' AND seat_number IS NOT NULL AND seat_email_sent=FALSE AND (seat_email_sending_at IS NULL OR seat_email_sending_at < ${expiredClaim}) RETURNING full_name, email, seat_number`)[0];

  if (!row) return { sent: false, skipped: true };

  const subject = type === "confirmation" ? "Your Wedding Reservation Has Been Confirmed" : "Your Wedding Seat Number";
  const text = type === "confirmation"
    ? `Hello ${row.full_name},\n\nYour reservation has been successfully approved.\n\nThank you for confirming your attendance. We look forward to celebrating with you.\n\nYour seat number will be sent to you one week before the event.\n\nBest regards,\nCindy & Dorbor`
    : `Hello ${row.full_name},\n\nWe are excited to celebrate with you!\n\nYour reservation has been confirmed and your assigned seat number is:\n\nSeat ${row.seat_number}\n\nWe look forward to seeing you on 30 January 2027.\n\nBest regards,\nCindy & Dorbor`;

  try {
    await sendWeddingEmail(row.email, subject, text, `${id}-${type}`);
    if (type === "confirmation") {
      await database()`UPDATE reservations SET confirmation_email_sent=TRUE, confirmation_email_sent_at=${new Date().toISOString()}, confirmation_email_sending_at=NULL, confirmation_email_error=NULL WHERE id=${id}`;
    } else {
      await database()`UPDATE reservations SET seat_email_sent=TRUE, seat_email_sent_at=${new Date().toISOString()}, seat_email_sending_at=NULL, seat_email_error=NULL WHERE id=${id}`;
    }
    return { sent: true, skipped: false };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.slice(0, 1000) : "Email delivery failed";
    if (type === "confirmation") {
      await database()`UPDATE reservations SET confirmation_email_sending_at=NULL, confirmation_email_error=${message} WHERE id=${id}`;
    } else {
      await database()`UPDATE reservations SET seat_email_sending_at=NULL, seat_email_error=${message} WHERE id=${id}`;
    }
    return { sent: false, skipped: false, error: message };
  }
}