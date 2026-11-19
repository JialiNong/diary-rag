import { parse, type HTMLElement, type Node as HtmlNode } from "node-html-parser";
import { entryId } from "./id.js";
import type { DiaryEntry } from "./types.js";

const TIME = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})$/;

/** flomo's HTML export: one `.memo` is one note, and `.time` is already a full timestamp. */
export function parseFlomoHtml(html: string, sourcePath: string): DiaryEntry[] {
  const root = parse(html);
  const seen = new Map<string, number>();
  const entries: DiaryEntry[] = [];

  for (const memo of root.querySelectorAll(".memo")) {
    const timeText = memo.querySelector(".time")?.text.trim() ?? "";
    const content = memo.querySelector(".content");
    const body = content ? normalizeBody(textFrom(content)) : "";
    if (!body) continue;

    const matched = timeText.match(TIME);
    const day = matched?.[1] ?? null;
    const occurredAt = matched ? `${matched[1]}T${matched[2]}` : null;
    const key = `${day ?? ""}\0${occurredAt ?? ""}`;
    const ordinal = seen.get(key) ?? 0;
    seen.set(key, ordinal + 1);

    entries.push({
      id: entryId(["flomo", sourcePath, day ?? "", occurredAt ?? "", String(ordinal)]),
      source: "flomo",
      sourcePath,
      occurredAt,
      day,
      dateConfidence: day ? "high" : "missing",
      weekStart: null,
      weekEnd: null,
      body,
    });
  }

  return entries;
}

function textFrom(node: HtmlNode): string {
  if (node.nodeType === 3) return "rawText" in node ? node.rawText : "";
  const element = node as HTMLElement;
  const tag = element.tagName?.toLowerCase();
  if (tag === "br") return "\n";
  const inner = element.childNodes.map((child) => textFrom(child)).join("");
  if (tag === "li") return `\n- ${inner.trim()}\n`;
  if (tag === "p" || tag === "div") return `\n${inner.trim()}\n`;
  return inner;
}

function normalizeBody(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
