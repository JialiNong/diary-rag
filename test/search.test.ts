import assert from "node:assert/strict";
import test from "node:test";
import { onThisDay, searchEntries } from "../src/search.js";
import type { DiaryEntry } from "../src/types.js";

const entries: DiaryEntry[] = [
  entry("2024-11-19", "去年的面包"),
  entry("2026-11-19", "今天把面包烤糊了"),
  entry("2026-11-18", "雨下了一整天"),
];

test("search finds a word inside the day and returns newer days first", () => {
  const hits = searchEntries(entries, "面包");
  assert.deepEqual(
    hits.map((hit) => hit.entry.day),
    ["2026-11-19", "2024-11-19"],
  );
});

test("on this day collects the same month and day across years", () => {
  const found = onThisDay(entries, 11, 19);
  assert.deepEqual(
    found.map((entry) => entry.day),
    ["2024-11-19", "2026-11-19"],
  );
});

function entry(day: string, body: string): DiaryEntry {
  return {
    id: day,
    source: "obsidian",
    sourcePath: "/diary/2026.md",
    occurredAt: `${day}T00:00:00`,
    day,
    dateConfidence: "high",
    weekStart: null,
    weekEnd: null,
    body,
  };
}
