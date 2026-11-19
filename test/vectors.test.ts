import assert from "node:assert/strict";
import test from "node:test";
import { rankByVector } from "../src/query.js";
import type { DiaryEntry } from "../src/types.js";
import { cosine, type VectorStore } from "../src/vectors.js";

test("cosine of the same direction is 1", () => {
  assert.ok(Math.abs(cosine([1, 0], [4, 0]) - 1) < 1e-9);
  assert.ok(Math.abs(cosine([1, 0], [0, 1])) < 1e-9);
});

test("similar search keeps the closer entry", () => {
  const bread = entry("bread", "烤糊了");
  const rain = entry("rain", "下雨");
  const store: VectorStore = {
    model: "qwen3-embedding:0.6b",
    entries: {
      bread: { hash: "a", vector: [1, 0] },
      rain: { hash: "b", vector: [0, 1] },
    },
  };
  const ranked = rankByVector([bread, rain], store, [0.9, 0.1], 10, 0.5);
  assert.deepEqual(
    ranked.map((item) => item.id),
    ["bread"],
  );
});

function entry(id: string, body: string): DiaryEntry {
  return {
    id,
    source: "obsidian",
    sourcePath: "/diary/2026.md",
    occurredAt: "2026-11-19T00:00:00",
    day: "2026-11-19",
    dateConfidence: "high",
    weekStart: null,
    weekEnd: null,
    body,
  };
}
