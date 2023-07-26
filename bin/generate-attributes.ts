import crypto from "crypto";
import fs from "fs";

import { Command } from "@commander-js/extra-typings";
import cliProgress from "cli-progress";
import seedrandom from "seedrandom";

import { attributeOrder } from "../config/attributes/definitions";
import { processFinalAttributeSet } from "../config/attributes/transform";
import { generateAttributeSet } from "../src/attributes/generate";
import {
  appendSeedHistory,
  convertToNftMetadata,
  ensureOutputDir,
  loadAttributes,
  writeSummaryToDisk,
  writeToDisk,
} from "../src/attributes/io";
import { globToRegex } from "../src/glob";
import logger from "../src/logger";
import { AttributeSet } from "../src/types";

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const program = new Command()
  .description(
    "Generate random metadata based on the PRNG seed and the set of defined rules"
  )
  .requiredOption(
    "-n, --number <number>",
    "Number of attribute sets to generate"
  )
  .option("-s, --seed <string>", "Seed for random number generator")
  .option("--startFrom <number>", "Start from a specific token ID", "0")
  .option("-t, --trait <string>", "Regenerate all tokens with a specific trait")
  .option(
    "-f, --format <format>",
    "Output format (choices: metadata, attributes)",
    "metadata"
  );

program.parse();

const options = program.opts();

let attributeTokenIndex: Record<string, Record<string, number[]>>;
try {
  attributeTokenIndex = JSON.parse(
    fs.readFileSync("./output/attribute-token-index.json", {
      encoding: "utf-8",
    })
  );
} catch (e) {
  if (options.trait) {
    console.error("Specified trait but no attribute-token-index.json found");
    process.exit(1);
  }
}

const randomSeed = crypto.randomUUID();
let userSeed: string | undefined;
if (options.seed) {
  if (options.seed === "last") {
    const seedHistory = fs
      .readFileSync("./output/seed-history.txt", "utf-8")
      .split("\n");
    const lastSeed = seedHistory[seedHistory.length - 2].split(":")[0];
    if (lastSeed) userSeed = lastSeed;
  } else {
    userSeed = options.seed;
  }
}

const usedSeed = userSeed ?? String(randomSeed);
const rng = seedrandom.xorwow(usedSeed);

logger.info(`Seed:`, usedSeed);
logger.info(`Generating ${options.number} attribute sets`);

function main() {
  const count = Number(options.number);
  const startFrom = Number(options.startFrom);

  ensureOutputDir();
  appendSeedHistory(usedSeed);

  const attributes = loadAttributes();

  // We shuffle the list of canonical traits to remove any ordering bias that
  // can occur when defining the traits. I *think* over a large enough set of outputs
  // this shouldn't matter, but it seems to help for smaller output sets.
  shuffleArray(attributes);

  // If we're starting from a tokenID other than 0, we need to advance
  // the RNG to the correct position.
  for (let i = 0; i < startFrom * attributeOrder.length; i++) rng();

  progressBar.start(count, 0);

  const results: AttributeSet[] = [];
  for (let i = startFrom; i < startFrom + count; i++) {
    if (options.trait) {
      const [attribute, trait] = options.trait.split("/");
      const traitRegex = globToRegex(trait);

      // Fetch all trait keys that match the search query
      const traitKeys = Object.keys(attributeTokenIndex[attribute]).filter(
        (trait) => traitRegex.test(trait)
      );

      // For each trait that matched, check if at least 1 includes the current
      // tokenId.
      const hasTrait = traitKeys.some((traitKey) =>
        attributeTokenIndex[attribute][traitKey].includes(i)
      );

      if (!hasTrait) {
        for (let j = 0; j < attributeOrder.length; j++) rng();

        progressBar.increment();
        continue;
      }

      logger.debug("Reprocessing attributes for:", i);
    }

    const result = generateAttributeSet(attributes, rng);

    logger.debug(`Token #${i}:`, result);
    results.push(result);

    if (options.format === "metadata") {
      const intermediateOutput = convertToNftMetadata(result);
      const finalOutput = convertToNftMetadata(
        processFinalAttributeSet(result)
      );

      writeToDisk("internal", i, intermediateOutput);
      writeToDisk("final", i, finalOutput);
    } else {
      writeToDisk("internal", i, result);
    }

    progressBar.increment();
  }

  progressBar.stop();

  if (options.trait) {
    logger.info(
      "No summary written to disk due to trait filter, please run calculate-summary to regenerate"
    );
  } else {
    writeSummaryToDisk(attributes, results);
  }

  logger.debug(`Seed:`, usedSeed);
}

main();

function shuffleArray(array: unknown[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
