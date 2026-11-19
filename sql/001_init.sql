CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS entries (
  id text PRIMARY KEY,
  source text NOT NULL,
  source_path text NOT NULL,
  occurred_at timestamp,
  day date,
  date_confidence text NOT NULL,
  week_start date,
  week_end date,
  body text NOT NULL,
  embedding vector(1024)
);

CREATE INDEX IF NOT EXISTS entries_day_idx ON entries (day);
