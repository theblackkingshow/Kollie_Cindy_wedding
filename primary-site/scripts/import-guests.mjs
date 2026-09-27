import { readFile } from "node:fs/promises";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Set DATABASE_URL before importing guests.");

const backup = JSON.parse(await readFile(new URL("../../data/guests.json", import.meta.url), "utf8"));
const sql = postgres(databaseUrl, { prepare: false });

try {
  for (const guest of backup.guests) {
    await sql`
      INSERT INTO guests (id, code, name, seats, status, attendees, updated_at)
      VALUES (${guest.id}, ${guest.code}, ${guest.name}, ${guest.seats}, ${guest.status}, ${guest.attendees}, ${guest.updated_at})
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        seats = EXCLUDED.seats,
        status = EXCLUDED.status,
        attendees = EXCLUDED.attendees,
        updated_at = EXCLUDED.updated_at
    `;
  }
  console.log(`Imported ${backup.guests.length} guest records.`);
} finally {
  await sql.end();
}
