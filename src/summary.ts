import type { DiaryEntry } from "./types.js";

export function summarize(entries: DiaryEntry[]): string {
  const flomo = entries.filter((entry) => entry.source === "flomo").length;
  const obsidian = entries.filter((entry) => entry.source === "obsidian").length;
  const missing = entries.filter((entry) => entry.day === null).length;
  const days = entries.map((entry) => entry.day).filter((day): day is string => day !== null).sort();
  const range = days.length ? `${days[0]} → ${days[days.length - 1]}` : "no dated entries";
  return [
    `${entries.length} entries`,
    `  flomo ${flomo}`,
    `  obsidian ${obsidian}`,
    `  missing a day ${missing}`,
    `  ${range}`,
  ].join("\n");
}
