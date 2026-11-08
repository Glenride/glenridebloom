#!/usr/bin/env node
import { runPipeline } from "./pipeline.js";
import type { PipelineOptions } from "./pipeline.js";
import { logger } from "./utils/logger.js";
import type { ContentSource } from "./types.js";
import { promises as fs } from "node:fs";

interface CliArguments {
  command: string;
  options: {
    configPath?: string;
    storagePath?: string;
    minTags?: number;
  };
}

const parseArgs = (argv: string[]): CliArguments => {
  const [command = "run", ...rest] = argv;
  const options: CliArguments["options"] = {};

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--config") {
      options.configPath = rest[++index];
    } else if (arg === "--storage") {
      options.storagePath = rest[++index];
    } else if (arg === "--min-tags") {
      const value = Number.parseInt(rest[++index] ?? "", 10);
      if (Number.isFinite(value)) {
        options.minTags = value;
      }
    }
  }

  return { command, options };
};

const truncate = (input: string, maxLength = 280): string =>
  input.length > maxLength ? `${input.slice(0, maxLength - 1)}…` : input;

const loadSourcesFromFile = async (
  filePath: string
): Promise<ContentSource[]> => {
  const content = await fs.readFile(filePath, "utf-8");
  const parsed = JSON.parse(content) as ContentSource[];
  return parsed;
};

const printResults = (summary: Awaited<ReturnType<typeof runPipeline>>): void => {
  const grouped = new Map<string, typeof summary.insights>();

  for (const insight of summary.insights) {
    const tags = insight.tags.length ? insight.tags : ["Untagged"];
    for (const tag of tags) {
      if (!grouped.has(tag)) {
        grouped.set(tag, []);
      }
      grouped.get(tag)?.push(insight);
    }
  }

  console.log("\n================ Insight Report ================");
  console.log(
    `Fetched: ${summary.fetched} | Stored (new): ${summary.stored} | Filtered out: ${summary.filteredOut}`
  );

  if (!grouped.size) {
    console.log("No insights captured in this run.");
    return;
  }

  for (const [tag, insights] of grouped.entries()) {
    const sorted = insights.sort((a, b) => {
      if (!a.publishedAt && !b.publishedAt) {
        return 0;
      }
      if (!a.publishedAt) {
        return 1;
      }
      if (!b.publishedAt) {
        return -1;
      }
      return b.publishedAt.localeCompare(a.publishedAt);
    });

    console.log(`\n${tag.toUpperCase()} (${sorted.length})`);
    for (const insight of sorted) {
      const publishedAt = insight.publishedAt ?? "n/a";
      console.log(
        `- [${insight.sourceTitle}] ${insight.title} (${publishedAt})\n  ${insight.url}`
      );
      if (insight.summary) {
        const condensed = truncate(insight.summary.replace(/\s+/g, " ").trim());
        console.log(`  ${condensed}`);
      }
    }
  }
};

const printHelp = (): void => {
  console.log(`Usage: npm run scrape -- [command] [options]

Commands:
  run             Execute the ingestion pipeline (default)

Options:
  --config <path>   Provide JSON file describing sources
  --storage <path>  Override storage path (defaults to ./data/insights-cache.json)
  --min-tags <n>    Minimum required tags per insight (default 1)
`);
};

const main = async (): Promise<void> => {
  const { command, options } = parseArgs(process.argv.slice(2));

  switch (command) {
    case "run": {
      let sources: ContentSource[] | undefined;
      if (options.configPath) {
        try {
          sources = await loadSourcesFromFile(options.configPath);
        } catch (error) {
          logger.error(
            `Unable to load sources from ${options.configPath}`,
            error
          );
          process.exitCode = 1;
          return;
        }
      }

      const pipelineOptions: PipelineOptions = {};
      if (sources) {
        pipelineOptions.sources = sources;
      }
      if (options.storagePath) {
        pipelineOptions.storagePath = options.storagePath;
      }
      if (typeof options.minTags === "number") {
        pipelineOptions.minTags = options.minTags;
      }

      const result = await runPipeline(pipelineOptions);
      printResults(result);
      break;
    }
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    default:
      logger.warn(`Unknown command "${command}". Showing help.`);
      printHelp();
  }
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Fatal error", error);
    process.exit(1);
  });
