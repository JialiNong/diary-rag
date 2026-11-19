import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseFlomoHtml } from "../src/flomo.js";

test("one flomo memo is one entry, and the export timestamp is the date", () => {
  const html = readFileSync(new URL("../fixtures/flomo-sample.html", import.meta.url), "utf8");
  const entries = parseFlomoHtml(html, "/export/notes.html");
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.day, "2024-03-12");
  assert.equal(entries[0]?.occurredAt, "2024-03-12T21:06:00");
  assert.equal(entries[0]?.dateConfidence, "high");
  assert.match(entries[0]?.body ?? "", /面包/);
  assert.match(entries[1]?.body ?? "", /买了面粉/);
  assert.match(entries[1]?.body ?? "", /又出了门/);
  assert.notEqual(entries[0]?.id, entries[1]?.id);
});
