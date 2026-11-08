export type SourceType = "rss" | "puppeteer";

export interface BaseSource {
  id: string;
  title: string;
  type: SourceType;
  enabled?: boolean;
}

export interface RssSource extends BaseSource {
  type: "rss";
  url: string;
  maxItems?: number;
}

export interface PuppeteerExtractionField {
  selector: string;
  attribute?: string;
  regex?: string;
  dateFormat?: string;
}

export interface PuppeteerSource extends BaseSource {
  type: "puppeteer";
  entryUrl: string;
  itemSelector: string;
  fields: {
    title: PuppeteerExtractionField;
    url: PuppeteerExtractionField;
    summary?: PuppeteerExtractionField;
    date?: PuppeteerExtractionField;
  };
  waitForSelector?: string;
  maxItems?: number;
}

export type ContentSource = RssSource | PuppeteerSource;

export interface RawItem {
  id: string;
  sourceId: string;
  sourceTitle: string;
  title: string;
  url: string;
  publishedAt?: string;
  summary?: string;
  rawTags?: string[];
}

export interface NormalizedInsight extends RawItem {
  tags: string[];
  collectedAt: string;
}

export interface PipelineRunResult {
  fetched: number;
  stored: number;
  filteredOut: number;
  insights: NormalizedInsight[];
}
