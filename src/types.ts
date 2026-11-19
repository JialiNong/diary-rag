export type DateConfidence = "high" | "medium" | "missing";
export type DiarySource = "flomo" | "obsidian";

/** One retrievable diary record. Obsidian is one day. flomo is one memo. */
export type DiaryEntry = {
  id: string;
  source: DiarySource;
  sourcePath: string;
  /** Wall-clock time from the source, with no timezone conversion. */
  occurredAt: string | null;
  /** YYYY-MM-DD, or null when the date could not be read. */
  day: string | null;
  dateConfidence: DateConfidence;
  weekStart: string | null;
  weekEnd: string | null;
  body: string;
};

export type SearchHit = {
  entry: DiaryEntry;
  snippet: string;
};
