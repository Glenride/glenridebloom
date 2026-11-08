import { promises as fs } from "node:fs";
import path from "node:path";
import type { NormalizedInsight } from "./types.js";
import { subHours, isAfter, parseISO, isValid } from "date-fns";

const DEFAULT_LOOKBACK_HOURS = 48;

export class InsightStore {
  private cache: Map<string, NormalizedInsight> | null = null;

  constructor(
    private readonly filePath: string,
    private readonly lookbackHours: number = DEFAULT_LOOKBACK_HOURS
  ) {}

  private async ensureLoaded(): Promise<void> {
    if (this.cache) {
      return;
    }
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      const data = JSON.parse(content) as NormalizedInsight[];
      this.cache = new Map(data.map((item) => [item.id, item]));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.cache = new Map();
        return;
      }
      throw error;
    }
  }

  private async persist(): Promise<void> {
    if (!this.cache) {
      return;
    }
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    const payload = JSON.stringify(Array.from(this.cache.values()), null, 2);
    await fs.writeFile(this.filePath, payload, "utf-8");
  }

  async filterNew(
    insights: NormalizedInsight[]
  ): Promise<{ fresh: NormalizedInsight[]; duplicates: NormalizedInsight[] }> {
    await this.ensureLoaded();
    const now = new Date();
    const cutoff = subHours(now, this.lookbackHours);

    const fresh: NormalizedInsight[] = [];
    const duplicates: NormalizedInsight[] = [];

    for (const insight of insights) {
      const existing = this.cache?.get(insight.id);
      if (!existing) {
        fresh.push(insight);
        continue;
      }
      let publishedDate: Date | undefined;
      if (existing.publishedAt) {
        const parsed = parseISO(existing.publishedAt);
        if (isValid(parsed)) {
          publishedDate = parsed;
        }
      }
      if (publishedDate && isAfter(publishedDate, cutoff)) {
        duplicates.push(insight);
      } else {
        fresh.push(insight);
      }
    }

    return { fresh, duplicates };
  }

  async upsert(insights: NormalizedInsight[]): Promise<void> {
    await this.ensureLoaded();
    if (!this.cache) {
      this.cache = new Map();
    }
    for (const insight of insights) {
      this.cache.set(insight.id, insight);
    }
    await this.persist();
  }
}
