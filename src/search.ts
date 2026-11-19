import type { DiaryEntry, SearchHit } from "./types.js";

export function searchEntries(entries: DiaryEntry[], query: string): SearchHit[] {
  const needle = query.trim();
  if (!needle) return [];
  const folded = needle.toLowerCase();
  return entries
    .filter((entry) => entry.body.toLowerCase().includes(folded))
    .map((entry) => ({ entry, snippet: snippet(entry.body, needle) }))
    .sort((a, b) => (b.entry.day ?? "").localeCompare(a.entry.day ?? ""));
}

export function onThisDay(entries: DiaryEntry[], month: number, day: number): DiaryEntry[] {
  const key = `-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return entries
    .filter((entry) => entry.day?.endsWith(key))
    .sort((a, b) => (a.day ?? "").localeCompare(b.day ?? ""));
}

export function snippet(body: string, query: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  const at = flat.toLowerCase().indexOf(query.trim().toLowerCase());
  if (at === -1) return clip(flat, 0);
  const start = Math.max(0, at - 40);
  return clip(flat, start);
}

function clip(text: string, start: number): string {
  const slice = text.slice(start, start + 140);
  const prefix = start > 0 ? "…" : "";
  const suffix = start + 140 < text.length ? "…" : "";
  return `${prefix}${slice}${suffix}`;
}
