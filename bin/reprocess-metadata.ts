import { Command } from "@commander-js/extra-typings";
import fs from "fs";
import {
  convertFromNftMetadata,
  convertToNftMetadata,
  ensureOutputDir,
  writeToDisk,
} from "../src/attributes/io";

import { NftMetadata } from "../src/types";
import cliProgress from "cli-progress";
import { processFinalAttributeSet } from "../config/attributes/transform";

new Command()
  .description("Re-generate the final metadata from the internal metadata")
  .parse();

const files = fs.readdirSync("./output/internal");
const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

function main() {
  ensureOutputDir();

  progressBar.start(files.length, 0);

  for (const file of files) {
    const tokenId = Number(file.split(".")[0]);
    const internalData = JSON.parse(
      fs.readFileSync(`./output/internal/${file}`, { encoding: "utf-8" })
    ) as NftMetadata;
    const oldAttrSet = convertFromNftMetadata(internalData);
    const newAttrSet = convertToNftMetadata(
      processFinalAttributeSet(oldAttrSet)
    );

    writeToDisk("final", tokenId, newAttrSet);
    progressBar.increment();
  }

  progressBar.stop();
}

main();
