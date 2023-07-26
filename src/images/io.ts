import fs from "fs";

import { globSync } from "glob";

import { AttributeSet, NftMetadata } from "../types";

const TOKEN_ID_REGEX = /(\d+)\.json/;

export function loadAttributesFromDisk(tokenIds?: string[]): AttributeSet[] {
  let files: string[];

  if (tokenIds?.length) {
    files = tokenIds.map((id) => `./output/internal/${id}.json`);
  } else {
    // We sort the files by tokenId to avoid any discrepancies between operating systems
    // in case the glob returns the files in a different order.
    files = globSync("./output/internal/*.json").sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const idA = parseInt(a.match(TOKEN_ID_REGEX)![1], 10);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const idB = parseInt(b.match(TOKEN_ID_REGEX)![1], 10);

      return idA - idB;
    });
  }

  return files.map((file) => {
    const data = JSON.parse(fs.readFileSync(file, { encoding: "utf-8" }));

    if ("attributes" in data) {
      return Object.fromEntries(
        (data as NftMetadata).attributes.map((attr) => [
          attr.trait_type,
          attr.value,
        ])
      );
    }

    return data;
  });
}

export async function ensureOutputDir() {
  fs.mkdirSync("./output/images", { recursive: true });
}
