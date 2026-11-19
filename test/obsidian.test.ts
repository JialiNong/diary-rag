import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseObsidianDiary } from "../src/obsidian.js";

const sample = readFileSync(new URL("../fixtures/obsidian/2026.md", import.meta.url), "utf8");

test("splits a year note on day lines and keeps week ranges as metadata", () => {
  const entries = parseObsidianDiary(sample, "/diary/2026.md");
  assert.deepEqual(
    entries.map((entry) => entry.day),
    ["2026-11-19", "2026-11-18", "2026-11-17", "2026-10-31"],
  );

  const nineteenth = entries[0];
  assert.ok(nineteenth);
  assert.equal(nineteenth.dateConfidence, "high");
  assert.equal(nineteenth.weekStart, "2026-11-16");
  assert.equal(nineteenth.weekEnd, "2026-11-22");
  assert.match(nineteenth.body, /面包/);
  assert.match(nineteenth.body, /明天再试一次/);

  const seventeenth = entries[2];
  assert.ok(seventeenth);
  assert.match(seventeenth.body, /1\. 先写一版简历。/);
  assert.match(seventeenth.body, /2\. 再去线下活动。/);

  const october = entries[3];
  assert.ok(october);
  assert.equal(october.weekStart, "2026-10-27");
  assert.equal(october.weekEnd, "2026-11-02");
});

test("a year filename without a month header is medium confidence", () => {
  const entries = parseObsidianDiary("11.19\n只有这一天。\n", "/diary/2026.md");
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.day, "2026-11-19");
  assert.equal(entries[0]?.dateConfidence, "medium");
});

test("prose with no year stays undated instead of being guessed", () => {
  const entries = parseObsidianDiary("11.19\n没有年份。\n", "/diary/notes.md");
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.day, null);
  assert.equal(entries[0]?.dateConfidence, "missing");
  assert.match(entries[0]?.body ?? "", /没有年份/);
});
