import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const reservations = pgTable("reservations", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  seatNumber: text("seat_number"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true, mode: "string" }),
  confirmationEmailSent: boolean("confirmation_email_sent").notNull().default(false),
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at", { withTimezone: true, mode: "string" }),
  confirmationEmailSendingAt: timestamp("confirmation_email_sending_at", { withTimezone: true, mode: "string" }),
  confirmationEmailError: text("confirmation_email_error"),
  seatEmailSent: boolean("seat_email_sent").notNull().default(false),
  seatEmailSentAt: timestamp("seat_email_sent_at", { withTimezone: true, mode: "string" }),
  seatEmailSendingAt: timestamp("seat_email_sending_at", { withTimezone: true, mode: "string" }),
  seatEmailError: text("seat_email_error"),
}, table => [
  uniqueIndex("idx_reservations_email_lower").on(sql`lower(${table.email})`),
  uniqueIndex("idx_reservations_seat_number").on(table.seatNumber),
  index("idx_reservations_status").on(table.status),
  index("idx_reservations_seat_email").on(table.status, table.seatEmailSent),
]);
