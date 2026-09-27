import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const guests = sqliteTable("guests", {
  id: text("id").primaryKey(), code: text("code").notNull(), name: text("name").notNull(),
  seats: integer("seats").notNull().default(1),
  status: text("status", { enum: ["pending", "yes", "no"] }).notNull().default("pending"),
  attendees: integer("attendees").notNull().default(0), updatedAt: text("updated_at").notNull(),
}, table => [uniqueIndex("idx_guests_code").on(table.code)]);
