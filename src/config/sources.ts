import type { ContentSource } from "../types.js";

export const DEFAULT_SOURCES: ContentSource[] = [
  {
    id: "techcrunch",
    title: "TechCrunch",
    type: "rss",
    url: "https://techcrunch.com/feed/",
    maxItems: 30
  },
  {
    id: "venturebeat",
    title: "VentureBeat",
    type: "rss",
    url: "https://venturebeat.com/feed/",
    maxItems: 30
  },
  {
    id: "crunchbase-news",
    title: "Crunchbase News",
    type: "rss",
    url: "https://news.crunchbase.com/feed/",
    maxItems: 30
  },
  {
    id: "crunchbase-browser",
    title: "Crunchbase News (site scraper)",
    type: "puppeteer",
    entryUrl: "https://news.crunchbase.com/news/",
    itemSelector: "article",
    waitForSelector: "article",
    maxItems: 15,
    fields: {
      title: { selector: "h2 a, h3 a" },
      url: { selector: "h2 a, h3 a", attribute: "href" },
      summary: { selector: "p" },
      date: { selector: "time", attribute: "datetime" }
    }
  }
];
