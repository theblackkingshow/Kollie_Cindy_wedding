import { readFile } from "node:fs/promises";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Set DATABASE_URL before initializing the database.");

const sql = postgres(databaseUrl, { prepare: false });
try {
  const schema = await readFile(new URL("../vercel-schema.sql", import.meta.url), "utf8");
  await sql.unsafe(schema);
  console.log("Guest table is ready.");
} finally {
  await sql.end();
}
