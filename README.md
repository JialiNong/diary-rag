**English** · [中文](README.zh.md)

# diary-rag

Local diary search in Node.js. It reads a flomo HTML export and Obsidian year notes on your machine, cuts them into dated entries, and opens a private page where a search shows the full entry.

The diary text is not in this repository. `fixtures/` is made-up sample text. Imports go to `data/`, and your own paths live in `.env`. Both are gitignored.

## How a day is recognized

In an Obsidian year note, a line starts a new record only when the whole line is one of these markers. A date inside a sentence, or a list line such as `1. Write a resume.`, stays in the body.

```text
2026.11          month section, sets the year
11.16-11.22      week range, stored on the days inside it
11.19            one day, until the next marker
```

If the file is named `2026.md` and the note has no `2026.11` line, the year comes from the file name and is marked less certain. Text with no year is kept, without a date.

A flomo export is not split. Each `.memo` is one entry. The date is the `.time` already in the export.

## Use

```bash
npm install
npm test
cp .env.example .env
```

Put your flomo export and Obsidian diary folder in `.env`, then:

```bash
npm run ingest
npm run dev
```

Open http://127.0.0.1:4173 . The page stays on this computer. Search shows the whole entry.

The command line still works:

```bash
npm run search -- bread
npm run on-this-day -- --month 11 --day 19
```

`ingest` prints counts and the date range. It does not print diary text.

## Similar meaning

Exact words work with no model. To find a day that never uses your search words, install one local embedding model. It is about 639MB. The diary is embedded on this Mac and is not sent to a hosted API.

```bash
brew install ollama
brew services start ollama
ollama pull qwen3-embedding:0.6b
npm run embed
```

If `brew services` is not available, open the Ollama app, or run `ollama serve` in another terminal. Then choose **Similar meaning** on the page.

A chat model that writes a year review is a later step. You do not need it to try search.

## Postgres

Optional. The page reads `data/entries.jsonl` and does not need Docker.

```bash
docker compose up -d
npm run db:load
```

`sql/001_init.sql` stores one row per entry. `day` filters by date. `embedding` is reserved for a later database-side vector index. The page ranks vectors in Node after `npm run embed`.

## Later

A generated year review, and linking a day to the map app, are not built yet. Photos and calendar events stay on the phone.
