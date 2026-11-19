import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { loadEnv } from "./env.js";
import { runQuery } from "./query.js";
import { readEntries } from "./store.js";
import { readVectorStore } from "./vectors.js";

const ENTRIES = "data/entries.jsonl";
const VECTORS = "data/embeddings.json";
const PAGE = new URL("../public/index.html", import.meta.url);

export function startServer(port = Number(process.env.PORT ?? 4173)): void {
  loadEnv();
  const server = createServer((request, response) => {
    void handle(request, response).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Request failed";
      sendJson(response, 500, { note: message });
    });
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Diary is at http://127.0.0.1:${port}`);
  });
}

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (request.method !== "GET") {
    sendJson(response, 405, { note: "GET only" });
    return;
  }
  if (url.pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(readFileSync(PAGE));
    return;
  }
  if (url.pathname === "/api/status") {
    const entries = readEntries(ENTRIES);
    const store = readVectorStore(VECTORS);
    const model = process.env.EMBED_MODEL ?? "qwen3-embedding:0.6b";
    sendJson(response, 200, {
      entries: entries.length,
      embedded: store.model === model ? Object.keys(store.entries).length : 0,
      model,
    });
    return;
  }
  if (url.pathname === "/api/search") {
    const mode = url.searchParams.get("mode") === "similar" ? "similar" : "word";
    const result = await runQuery({
      entries: readEntries(ENTRIES),
      store: readVectorStore(VECTORS),
      mode,
      query: url.searchParams.get("q") ?? "",
    });
    sendJson(response, 200, result);
    return;
  }
  if (url.pathname === "/api/today") {
    const month = numberOrUndefined(url.searchParams.get("month"));
    const day = numberOrUndefined(url.searchParams.get("day"));
    const result = await runQuery({
      entries: readEntries(ENTRIES),
      store: readVectorStore(VECTORS),
      mode: "today",
      month,
      day,
    });
    sendJson(response, 200, result);
    return;
  }
  sendJson(response, 404, { note: "not-found" });
}

function numberOrUndefined(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}
