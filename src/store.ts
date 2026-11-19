import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { DiaryEntry } from "./types.js";

export function writeEntries(file: string, entries: DiaryEntry[]): void {
  mkdirSync(path.dirname(file), { recursive: true });
  const text = entries.map((entry) => JSON.stringify(entry)).join("\n");
  writeFileSync(file, text.length ? `${text}\n` : "");
}

export function readEntries(file: string): DiaryEntry[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as DiaryEntry);
}
