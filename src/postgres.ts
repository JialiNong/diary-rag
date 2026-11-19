import { readFileSync } from "node:fs";
import pg from "pg";
import type { DiaryEntry } from "./types.js";

const { Pool } = pg;

export async function loadIntoPostgres(entries: DiaryEntry[]): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Start Postgres with: docker compose up -d");
  }
  const pool = new Pool({ connectionString });
  const sql = readFileSync(new URL("../sql/001_init.sql", import.meta.url), "utf8");
  await pool.query(sql);
  for (const entry of entries) {
    await pool.query(
      `INSERT INTO entries (
         id, source, source_path, occurred_at, day, date_confidence, week_start, week_end, body
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         source_path = EXCLUDED.source_path,
         occurred_at = EXCLUDED.occurred_at,
         day = EXCLUDED.day,
         date_confidence = EXCLUDED.date_confidence,
         week_start = EXCLUDED.week_start,
         week_end = EXCLUDED.week_end,
         body = EXCLUDED.body`,
      [
        entry.id,
        entry.source,
        entry.sourcePath,
        entry.occurredAt,
        entry.day,
        entry.dateConfidence,
        entry.weekStart,
        entry.weekEnd,
        entry.body,
      ],
    );
  }
  await pool.end();
}
