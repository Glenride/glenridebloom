import pLimit from "p-limit";
import { DEFAULT_SOURCES } from "./config/sources.js";
import { fetchRssSource } from "./rss/fetchRss.js";
import { scrapePuppeteerSource } from "./scrapers/puppeteerScraper.js";
import { InsightStore } from "./storage.js";
import type { ContentSource, PipelineRunResult, RawItem } from "./types.js";
import { toNormalizedInsight } from "./tagging.js";
import { logger } from "./utils/logger.js";
import path from "node:path";

const limit = pLimit(4);

export interface PipelineOptions {
  sources?: ContentSource[];
  storagePath?: string;
  minTags?: number;
}

const collectFromSource = async (source: ContentSource): Promise<RawItem[]> => {
  try {
    logger.info(`Collecting from ${source.title} (${source.type})`);
    if (source.type === "rss") {
      return await fetchRssSource(source);
    }
    return await scrapePuppeteerSource(source);
  } catch (error) {
    logger.error(`Failed to collect from ${source.title}`, error);
    return [];
  }
};

export const runPipeline = async (
  options: PipelineOptions = {}
): Promise<PipelineRunResult> => {
  const sources =
    options.sources?.filter((source) => source.enabled !== false) ??
    DEFAULT_SOURCES.filter((source) => source.enabled !== false);

  const rawItemsBatches = await Promise.all(
    sources.map((source) => limit(() => collectFromSource(source)))
  );

  const rawItems = rawItemsBatches.flat();
  const normalized = rawItems.map((item) => toNormalizedInsight(item));

  const minTags = options.minTags ?? 1;
  const tagged = normalized.filter((item) => item.tags.length >= minTags);

  if (!tagged.length) {
    logger.warn("No items met tagging criteria. Consider relaxing minTags.");
  }

  const taggedCount = tagged.length;
  const storagePath =
    options.storagePath ??
    path.join(process.cwd(), "data", "insights-cache.json");

  const store = new InsightStore(storagePath);
  const { fresh, duplicates } = await store.filterNew(tagged);
  await store.upsert(fresh);

  logger.info(
    `Processed ${rawItems.length} raw items → ${taggedCount} tagged → ${fresh.length} fresh (duplicates: ${duplicates.length})`
  );

  return {
    fetched: rawItems.length,
    stored: fresh.length,
    filteredOut: rawItems.length - fresh.length,
    insights: fresh
  };
};
