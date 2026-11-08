import Parser from "rss-parser";
import type { RssSource, RawItem } from "../types.js";
import { hashString } from "../utils/hash.js";

const parser = new Parser({
  headers: {
    "User-Agent":
      "GlenrideBloomBot/1.0 (+https://glenridebloom.example; market research automation)"
  }
});

export const fetchRssSource = async (
  source: RssSource
): Promise<RawItem[]> => {
  const feed = await parser.parseURL(source.url);
  const maxItems = source.maxItems ?? 30;

  return (feed.items || []).slice(0, maxItems).map((item, index) => {
    const url = item.link ?? item.guid ?? `${source.url}#${index}`;
    const id = hashString(`${source.id}:${url}`);
    return {
      id,
      sourceId: source.id,
      sourceTitle: source.title,
      title: item.title?.trim() ?? "(Untitled)",
      url,
      publishedAt: item.isoDate ?? item.pubDate ?? undefined,
      summary: item.contentSnippet?.trim() ?? undefined
    };
  });
};
