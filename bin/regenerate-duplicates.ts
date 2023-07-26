/**
 * This script will continue running until there are no more duplicate
 * outputs.
 */
import crypto from "crypto";
import fs from "fs";

import { Command } from "@commander-js/extra-typings";
import cliProgress from "cli-progress";
import seedrandom from "seedrandom";

import { processFinalAttributeSet } from "../config/attributes/transform";
import { generateAttributeSet } from "../src/attributes/generate";
import {
  convertToNftMetadata,
  loadAttributes,
  writeToDisk,
} from "../src/attributes/io";
import logger from "../src/logger";
import { AttributeSet, NftMetadata } from "../src/types";

const program = new Command()
  .description(
    "Search for duplicate outputs and regenerate them using the PRNG until no duplicate remains"
  )
  .option("-s, --seed <string>", "Seed for random number generator")
  .parse();

const options = program.opts();

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

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const outputFiles = fs.readdirSync("./output/internal");
const fileHashes = Object.fromEntries(
  outputFiles.map((file) => {
    const hash = calculateFileHash(file);

    return [file, hash];
  })
);

const hashes = Object.values(fileHashes);

function main() {
  const duplicates = Object.entries(fileHashes).filter(([, hash]) => {
    return hashes.filter((h) => h === hash).length > 1;
  });

  if (duplicates.length === 0) {
    logger.info("No duplicates found");
    return;
  }

  logger.info(`Found ${duplicates.length} duplicates`);
  logger.info(`Seed:`, usedSeed);

  progressBar.start(duplicates.length, 0);
  const attributes = loadAttributes();

  for (const [file, hash] of duplicates) {
    const tokenId = Number(file.split(".")[0]);

    logger.debug(`Regenerating #${tokenId}`);
    logger.debug(`Original hash: ${hash}`);

    let newHash = hash;
    let result: AttributeSet;
    let attempt = 1;

    do {
      logger.debug(`Attempt #${attempt++}`);
      result = generateAttributeSet(attributes, rng);
      const metadata = convertToNftMetadata(result);
      newHash = calculateAttributeHash(metadata);
    } while (!metadataIsUnique(newHash));

    logger.debug(`New hash: ${newHash}`);
    const hashIndex = hashes.indexOf(hash);
    hashes[hashIndex] = newHash;

    const intermediateOutput = convertToNftMetadata(result);
    const finalOutput = convertToNftMetadata(processFinalAttributeSet(result));

    writeToDisk("internal", tokenId, intermediateOutput);
    writeToDisk("final", tokenId, finalOutput);

    progressBar.increment();
  }

  progressBar.stop();
}

main();

function calculateFileHash(file: string) {
  const buff = fs.readFileSync(`./output/internal/${file}`, {
    encoding: "utf-8",
  });

  const data: NftMetadata = JSON.parse(buff);
  return calculateAttributeHash(data);
}

function calculateAttributeHash(data: NftMetadata) {
  const localData = { ...data };

  // Delete background color from the hash
  delete localData.attributes[data.attributes.length - 1];

  return crypto
    .createHash("md5")
    .update(JSON.stringify(localData))
    .digest("hex");
}

function metadataIsUnique(hash: string) {
  return !hashes.includes(hash);
}
