const QUERY_INSTRUCTION =
  "Given a diary search, retrieve passages that match the meaning of the query.";

/** Qwen3 embedding models expect this prefix on the query only, not on diary text. */
export function formatQuery(query: string): string {
  return `Instruct: ${QUERY_INSTRUCTION}\nQuery:${query}`;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const base = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
  const model = process.env.EMBED_MODEL ?? "qwen3-embedding:0.6b";
  const response = await fetch(`${base}/api/embed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, input: texts }),
  });
  if (!response.ok) {
    throw new Error(
      `Ollama embed failed (${response.status}). Pull the model with: ollama pull ${model}`,
    );
  }
  const json = (await response.json()) as { embeddings?: number[][] };
  if (!json.embeddings) throw new Error("Ollama returned no embeddings.");
  return json.embeddings;
}
