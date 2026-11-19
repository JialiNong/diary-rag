import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { embedTexts } from "./embed.js";
import type { DiaryEntry } from "./types.js";

export type StoredVector = {
  hash: string;
  vector: number[];
};

export type VectorStore = {
  model: string;
  entries: Record<string, StoredVector>;
};

export const EMPTY_STORE: VectorStore = { model: "", entries: {} };

export function hashBody(body: string): string {
  return createHash("sha256").update(body).digest("hex").slice(0, 16);
}

export function cosine(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }
  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function readVectorStore(file: string): VectorStore {
  if (!existsSync(file)) return { model: "", entries: {} };
  const parsed = JSON.parse(readFileSync(file, "utf8")) as VectorStore;
  return {
    model: parsed.model ?? "",
    entries: parsed.entries ?? {},
  };
}

export function writeVectorStore(file: string, store: VectorStore): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(store));
}

/** Embed entries whose text changed. Diary bodies are not printed. */
export async function embedMissing(
  entries: DiaryEntry[],
  file: string,
  model = process.env.EMBED_MODEL ?? "qwen3-embedding:0.6b",
): Promise<number> {
  const existing = readVectorStore(file);
  const saved: VectorStore = {
    model,
    entries: existing.model === model ? { ...existing.entries } : {},
  };
  const pending = entries.filter((entry) => saved.entries[entry.id]?.hash !== hashBody(entry.body));
  console.log(`${pending.length} to embed, ${entries.length - pending.length} unchanged`);
  const batchSize = 8;
  for (let start = 0; start < pending.length; start += batchSize) {
    const slice = pending.slice(start, start + batchSize);
    const vectors = await embedTexts(slice.map((entry) => entry.body.slice(0, 6000)));
    slice.forEach((entry, index) => {
      const vector = vectors[index];
      if (!vector) return;
      saved.entries[entry.id] = { hash: hashBody(entry.body), vector };
    });
    writeVectorStore(file, saved);
    console.log(`embedded ${Math.min(start + batchSize, pending.length)}/${pending.length}`);
  }
  return pending.length;
}
