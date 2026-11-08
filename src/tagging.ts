import type { NormalizedInsight, RawItem } from "./types.js";
import { formatISO9075, parseISO, isValid } from "date-fns";

type TagDefinition = {
  tag: string;
  keywords: string[];
  patterns?: RegExp[];
};

const TAG_DEFINITIONS: TagDefinition[] = [
  {
    tag: "Funding",
    keywords: ["raises", "funding", "seed round", "series", "venture capital"],
    patterns: [/Series [ABCDEF]/i, /seed round/i, /\$[\d,.]+\s?(million|thousand|bn)/i]
  },
  {
    tag: "Partnership",
    keywords: ["partnership", "collaborate", "partners with", "joint venture"]
  },
  {
    tag: "Acquisition",
    keywords: ["acquires", "acquisition", "merger", "merges with"]
  },
  {
    tag: "Product Launch",
    keywords: ["launches", "introduces", "debuts", "unveils"]
  },
  {
    tag: "Hiring",
    keywords: ["hires", "appoints", "names", "chief", "executive"]
  }
];

const normalizeString = (input?: string): string => input?.toLowerCase() ?? "";

const matchTag = (text: string, definition: TagDefinition): boolean => {
  return (
    definition.keywords.some((kw) => text.includes(kw)) ||
    (definition.patterns ?? []).some((pattern) => pattern.test(text))
  );
};

export const tagItem = (item: RawItem): string[] => {
  const haystack = `${normalizeString(item.title)} ${normalizeString(
    item.summary
  )}`;

  const tags = TAG_DEFINITIONS.filter((definition) =>
    matchTag(haystack, definition)
  ).map((definition) => definition.tag);

  return Array.from(new Set(tags));
};

export const toNormalizedInsight = (item: RawItem): NormalizedInsight => {
  const tags = tagItem(item);
  let parsedPublishedAt: Date | undefined;
  if (item.publishedAt) {
    const parsed = parseISO(item.publishedAt);
    if (isValid(parsed)) {
      parsedPublishedAt = parsed;
    }
  }

  return {
    ...item,
    tags,
    collectedAt: formatISO9075(new Date()),
    publishedAt: parsedPublishedAt ? formatISO9075(parsedPublishedAt) : undefined
  };
};
