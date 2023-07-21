import { globSync } from "glob";
import fs from "fs";
import {
  convertFromNftMetadata,
  loadAttributes,
  writeSummaryToDisk,
} from "src/attributes/io";
import { NftMetadata } from "src/types";
import logger from "src/logger";

const attributes = loadAttributes();
const tokenIdMatcher = /(\d+)\.json$/;
const files = globSync("./output/internal/*.json").sort((a, b) => {
  const idA = Number(a.match(tokenIdMatcher)?.[1]);
  const idB = Number(b.match(tokenIdMatcher)?.[1]);

  return idA - idB;
});

const attrSets = files
  .map(
    (file) =>
      JSON.parse(fs.readFileSync(file, { encoding: "utf-8" })) as NftMetadata
  )
  .map((metadata) => convertFromNftMetadata(metadata));

writeSummaryToDisk(attributes, attrSets);

logger.info(`Wrote summaries to ./output`);