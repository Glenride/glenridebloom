import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { PuppeteerExtra } from "puppeteer-extra";
import type { Page } from "puppeteer";
import type { PuppeteerSource, RawItem } from "../types.js";
import { hashString } from "../utils/hash.js";

const puppeteer = puppeteerExtra as unknown as PuppeteerExtra;
puppeteer.use(StealthPlugin());

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";

type ExtractedItem = {
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string;
};

const scrapeItems = async (
  page: Page,
  source: PuppeteerSource
): Promise<ExtractedItem[]> => {
  return page.$$eval(
    source.itemSelector,
    (elements, config): ExtractedItem[] => {
      const maxItems = config.maxItems ?? elements.length;
      const slice = Array.from(elements).slice(0, maxItems);

      const extractValue = (
        root: Element,
        field?:
          | {
              selector: string;
              attribute?: string;
              regex?: string;
            }
          | undefined
      ): string | undefined => {
        if (!field) {
          return undefined;
        }
        const node = root.querySelector(field.selector);
        if (!node) {
          return undefined;
        }
        let value: string | null;
        if (field.attribute) {
          const attr = node.getAttribute(field.attribute);
          value = attr ?? null;
        } else {
          value = node.textContent;
        }
        if (!value) {
          return undefined;
        }
        const trimmed = value.trim();
        if (!trimmed) {
          return undefined;
        }
        if (field.regex) {
          const match = trimmed.match(new RegExp(field.regex));
          return match?.[1]?.trim() ?? match?.[0]?.trim();
        }
        return trimmed;
      };

      return slice.reduce<ExtractedItem[]>((accumulator, element) => {
        const title =
          extractValue(element, config.fields.title) ?? "(Untitled)";
        const urlRaw = extractValue(element, config.fields.url) ?? "";
        if (!urlRaw) {
          return accumulator;
        }
        const url = new URL(urlRaw, window.location.href).href;
        accumulator.push({
          title,
          url,
          summary: extractValue(element, config.fields.summary),
          publishedAt: extractValue(element, config.fields.date)
        });
        return accumulator;
      }, []);
    },
    {
      itemSelector: source.itemSelector,
      fields: source.fields,
      maxItems: source.maxItems
    }
  );
};

export const scrapePuppeteerSource = async (
  source: PuppeteerSource
): Promise<RawItem[]> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 720 }
  });

  let page: Page | null = null;

  try {
    const newPage = await browser.newPage();
    page = newPage;
    await newPage.setUserAgent(USER_AGENT);
    await newPage.goto(source.entryUrl, {
      waitUntil: "networkidle2",
      timeout: 60_000
    });

    if (source.waitForSelector) {
      await newPage.waitForSelector(source.waitForSelector, { timeout: 30_000 });
    }

    const extracted = await scrapeItems(newPage, source);

    return extracted.map((item) => ({
      id: hashString(`${source.id}:${item.url}`),
      sourceId: source.id,
      sourceTitle: source.title,
      title: item.title,
      url: item.url,
      summary: item.summary,
      publishedAt: item.publishedAt
    }));
  } finally {
    if (page) {
      await page.close().catch(() => undefined);
    }
    await browser.close().catch(() => undefined);
  }
};
