import { entryId } from "./id.js";
import { isValidDate, isoDate, yearFromFilename } from "./dates.js";
import type { DateConfidence, DiaryEntry } from "./types.js";

/**
 * Year notes use three kinds of marker lines, and nothing else starts a new record:
 *
 *   2026.11          month section. Sets the year.
 *   11.16-11.22      week section. Stored on the following days, not its own entry.
 *   11.19            one day. The following lines belong to this day until the next marker.
 *
 * A date only counts when the whole line is the marker. "1. 先写简历。" stays in the body.
 */

const FULL_DATE = /^(20\d{2})\.(\d{1,2})\.(\d{1,2})$/;
const MONTH = /^(20\d{2})\.(\d{1,2})$/;
const WEEK = /^(\d{1,2})\.(\d{1,2})\s*[-–—]\s*(\d{1,2})\.(\d{1,2})$/;
const DAY = /^(\d{1,2})\.(\d{1,2})$/;

type WeekSpan = { start: string; end: string };

type Draft = {
  day: string | null;
  dateConfidence: DateConfidence;
  week: WeekSpan | null;
  lines: string[];
};

export function parseObsidianDiary(markdown: string, sourcePath: string): DiaryEntry[] {
  const filenameYear = yearFromFilename(sourcePath);
  let sectionYear: number | null = filenameYear;
  let sawYearHeader = false;
  let week: WeekSpan | null = null;
  let open: Draft | null = null;
  const drafts: Draft[] = [];
  const orphans: string[] = [];

  const flush = () => {
    if (!open) return;
    if (open.lines.join("\n").trim()) drafts.push(open);
    open = null;
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const marker = markerText(rawLine);
    const full = marker.match(FULL_DATE);
    const month = marker.match(MONTH);
    const weekMatch = marker.match(WEEK);
    const day = marker.match(DAY);

    if (full && isValidDate(Number(full[1]), Number(full[2]), Number(full[3]))) {
      flush();
      sectionYear = Number(full[1]);
      sawYearHeader = true;
      open = {
        day: isoDate(Number(full[1]), Number(full[2]), Number(full[3])),
        dateConfidence: "high",
        week,
        lines: [],
      };
      continue;
    }

    if (month && Number(month[2]) >= 1 && Number(month[2]) <= 12) {
      flush();
      sectionYear = Number(month[1]);
      sawYearHeader = true;
      week = null;
      continue;
    }

    if (weekMatch) {
      const startMonth = Number(weekMatch[1]);
      const startDay = Number(weekMatch[2]);
      const endMonth = Number(weekMatch[3]);
      const endDay = Number(weekMatch[4]);
      const span = weekSpan(sectionYear, startMonth, startDay, endMonth, endDay);
      if (span) {
        flush();
        week = span;
        continue;
      }
    }

    if (day && sectionYear !== null && isValidDate(sectionYear, Number(day[1]), Number(day[2]))) {
      flush();
      open = {
        day: isoDate(sectionYear, Number(day[1]), Number(day[2])),
        dateConfidence: sawYearHeader ? "high" : "medium",
        week,
        lines: [],
      };
      continue;
    }

    if (open) open.lines.push(rawLine);
    else orphans.push(rawLine);
  }

  flush();

  const orphanBody = normalizeBody(orphans.join("\n"));
  if (orphanBody) {
    drafts.unshift({
      day: null,
      dateConfidence: "missing",
      week: null,
      lines: [orphanBody],
    });
  }

  return toEntries(drafts, sourcePath);
}

function toEntries(drafts: Draft[], sourcePath: string): DiaryEntry[] {
  const groups = new Map<string, Draft[]>();
  const order: string[] = [];
  for (const draft of drafts) {
    const key = draft.day ?? `missing-${order.length}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)?.push(draft);
  }

  const entries: DiaryEntry[] = [];
  for (const key of order) {
    const group = groups.get(key) ?? [];
    const body = normalizeBody(group.map((draft) => draft.lines.join("\n")).join("\n\n"));
    if (!body) continue;
    const first = group[0];
    if (!first) continue;
    const ordinal = entries.filter((entry) => entry.day === first.day).length;
    entries.push({
      id: entryId(["obsidian", sourcePath, first.day ?? "", String(ordinal)]),
      source: "obsidian",
      sourcePath,
      occurredAt: first.day ? `${first.day}T00:00:00` : null,
      day: first.day,
      dateConfidence: first.dateConfidence,
      weekStart: first.week?.start ?? null,
      weekEnd: first.week?.end ?? null,
      body,
    });
  }
  return entries;
}

function weekSpan(
  year: number | null,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): WeekSpan | null {
  if (year === null) return null;
  const endYear = endMonth < startMonth ? year + 1 : year;
  if (!isValidDate(year, startMonth, startDay) || !isValidDate(endYear, endMonth, endDay)) {
    return null;
  }
  return {
    start: isoDate(year, startMonth, startDay),
    end: isoDate(endYear, endMonth, endDay),
  };
}

export function markerText(line: string): string {
  return line
    .trim()
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*+|\*+$/g, "")
    .replace(/[．。]/g, ".")
    .trim();
}

function normalizeBody(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
