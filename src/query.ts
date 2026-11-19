import { embedTexts, formatQuery } from "./embed.js";
import { onThisDay, searchEntries } from "./search.js";
import type { DiaryEntry } from "./types.js";
import { cosine, type VectorStore } from "./vectors.js";

export type PublicEntry = {
  id: string;
  day: string | null;
  occurredAt: string | null;
  source: DiaryEntry["source"];
  weekStart: string | null;
  weekEnd: string | null;
  body: string;
};

export type QueryResult = {
  hits: PublicEntry[];
  total: number;
  note: string | null;
};

const LIMIT = 40;

export function toPublic(entry: DiaryEntry): PublicEntry {
  return {
    id: entry.id,
    day: entry.day,
    occurredAt: entry.occurredAt,
    source: entry.source,
    weekStart: entry.weekStart,
    weekEnd: entry.weekEnd,
    body: entry.body,
  };
}

export function rankByVector(
  entries: DiaryEntry[],
  store: VectorStore,
  vector: number[],
  limit = LIMIT,
  minScore = 0.35,
): DiaryEntry[] {
  return entries
    .flatMap((entry) => {
      const stored = store.entries[entry.id];
      if (!stored) return [];
      const score = cosine(stored.vector, vector);
      return score >= minScore ? [{ entry, score }] : [];
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((row) => row.entry);
}

export async function runQuery(options: {
  entries: DiaryEntry[];
  store: VectorStore;
  mode: "word" | "similar" | "today";
  query?: string;
  month?: number;
  day?: number;
}): Promise<QueryResult> {
  if (options.mode === "today") {
    const now = new Date();
    const found = onThisDay(
      options.entries,
      options.month ?? now.getMonth() + 1,
      options.day ?? now.getDate(),
    );
    return { hits: found.map(toPublic), total: found.length, note: null };
  }

  const query = options.query?.trim() ?? "";
  if (!query) return { hits: [], total: 0, note: "empty-query" };

  if (options.mode === "word") {
    const found = searchEntries(options.entries, query);
    return {
      hits: found.slice(0, LIMIT).map((hit) => toPublic(hit.entry)),
      total: found.length,
      note: null,
    };
  }

  const model = process.env.EMBED_MODEL ?? "qwen3-embedding:0.6b";
  const ready = options.store.model === model && Object.keys(options.store.entries).length > 0;
  if (!ready) return { hits: [], total: 0, note: "embeddings-missing" };

  try {
    const [vector] = await embedTexts([formatQuery(query)]);
    if (!vector) return { hits: [], total: 0, note: "embed-failed" };
    const ranked = rankByVector(options.entries, options.store, vector);
    return { hits: ranked.map(toPublic), total: ranked.length, note: null };
  } catch {
    return { hits: [], total: 0, note: "embed-failed" };
  }
}
