import fs from "fs";
import { Command } from "@commander-js/extra-typings";

import cliProgress from "cli-progress";
import { ensureOutputDir, loadAttributesFromDisk } from "../src/images/io";
import { generateImageFromAttributes } from "../src/images/generate";
import logger from "../src/logger";
import { globToRegex } from "../src/glob";

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const program = new Command()
  .option("-n, --number <numbers...>", "Process specific token IDs")
  .option("--startFrom <number>", "Start processing from a specific token ID")
  .option("-s, --size <number>", "Resize the output image")
  .option("-t, --trait <string>", "Render all tokens with a specific trait");

program.parse();

const options = program.opts();

async function main() {
  ensureOutputDir();

  let idsToRender: string[] = [];
  if (options.trait) {
    const [attribute, traitName] = options.trait.split("/");
    const traitRegex = globToRegex(traitName);
    const attrTokenIndex = JSON.parse(
      fs.readFileSync("./output/attribute-token-index.json", {
        encoding: "utf-8",
      })
    );

    for (const [trait, tokenIds] of Object.entries(attrTokenIndex[attribute])) {
      if (traitRegex.test(trait)) {
        idsToRender = idsToRender.concat(tokenIds as string[]);
      }
    }
  } else if (options.number !== undefined) {
    idsToRender = options.number;
  }

  const attributesToProcess = loadAttributesFromDisk(idsToRender);

  const size = options.size ? Number(options.size) : undefined;

  if (options.trait !== undefined || options.number !== undefined) {
    const count = options.number?.length ?? attributesToProcess.length;
    logger.info("Compositing %d images", count);

    progressBar.start(count, 0);
    for (let i = 0; i < idsToRender.length; i++) {
      const tokenId = parseInt(idsToRender[i], 10);
      const attrSet = attributesToProcess[i];
      await generateImageFromAttributes(tokenId, attrSet, size);
      progressBar.increment();
    }
  } else {
    const startFrom = options.startFrom ? Number(options.startFrom) : 0;
    const count = attributesToProcess.length - startFrom;
    logger.info("Compositing %d images", count);

    progressBar.start(count, 0);
    for (let i = startFrom; i < attributesToProcess.length; i++) {
      const attrSet = attributesToProcess[i];
      await generateImageFromAttributes(i, attrSet, size);
      progressBar.increment();
    }
  }

  progressBar.stop();
}

main().then(() => process.exit(0));
