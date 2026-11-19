import { parseArgs } from "node:util";
import { loadEnv } from "./env.js";
import { ingestPaths } from "./ingest.js";
import { loadIntoPostgres } from "./postgres.js";
import { onThisDay, searchEntries } from "./search.js";
import { writeEntries, readEntries } from "./store.js";
import { summarize } from "./summary.js";

const DEFAULT_OUT = "data/entries.jsonl";

loadEnv();

const { positionals, values } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    flomo: { type: "string" },
    obsidian: { type: "string" },
    out: { type: "string", default: DEFAULT_OUT },
    month: { type: "string" },
    day: { type: "string" },
  },
});

const command = positionals[0];
const flomo = values.flomo ?? process.env.FLOMO_PATH;
const obsidian = values.obsidian ?? process.env.OBSIDIAN_PATH;
const out = values.out ?? DEFAULT_OUT;

try {
  if (command === "ingest" || command === "inspect") {
    const entries = ingestPaths({ flomo: emptyAsUndefined(flomo), obsidian: emptyAsUndefined(obsidian) });
    if (command === "ingest") writeEntries(out, entries);
    console.log(command === "ingest" ? `wrote ${out}` : "inspect");
    console.log(summarize(entries));
  } else if (command === "search") {
    const query = positionals.slice(1).join(" ").trim();
    if (!query) throw new Error("Usage: npm run search -- 面包");
    const hits = searchEntries(readEntries(out), query);
    if (hits.length === 0) {
      console.log("no matches");
    } else {
      for (const hit of hits) {
        console.log(`${hit.entry.day ?? "undated"}\t${hit.entry.source}\t${hit.snippet}`);
      }
    }
  } else if (command === "on-this-day") {
    const now = new Date();
    const month = Number(values.month ?? now.getMonth() + 1);
    const day = Number(values.day ?? now.getDate());
    const found = onThisDay(readEntries(out), month, day);
    if (found.length === 0) console.log(`nothing on ${month}-${day}`);
    for (const entry of found) {
      console.log(`\n${entry.day}\t${entry.source}`);
      console.log(entry.body);
    }
  } else if (command === "db:load") {
    const entries = readEntries(out);
    await loadIntoPostgres(entries);
    console.log(`loaded ${entries.length} entries into Postgres`);
  } else {
    console.log(`Usage:
  npm run ingest
  npm run inspect
  npm run search -- 面包
  npm run on-this-day -- --month 11 --day 19
  npm run db:load`);
    process.exitCode = command ? 1 : 0;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

function emptyAsUndefined(value: string | undefined): string | undefined {
  if (!value || value.trim() === "") return undefined;
  return value;
}
