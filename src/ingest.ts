import { readFileSync } from "node:fs";
import { parseFlomoHtml } from "./flomo.js";
import { collectFiles } from "./files.js";
import { parseObsidianDiary } from "./obsidian.js";
import type { DiaryEntry } from "./types.js";

export function ingestPaths(options: { flomo?: string; obsidian?: string }): DiaryEntry[] {
  const entries: DiaryEntry[] = [];
  if (options.flomo) {
    for (const file of collectFiles(options.flomo, ".html")) {
      entries.push(...parseFlomoHtml(readFileSync(file, "utf8"), file));
    }
  }
  if (options.obsidian) {
    for (const file of collectFiles(options.obsidian, ".md")) {
      entries.push(...parseObsidianDiary(readFileSync(file, "utf8"), file));
    }
  }
  return entries;
}
