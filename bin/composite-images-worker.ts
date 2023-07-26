import { Command } from "@commander-js/extra-typings";

import { loadAttributesFromDisk } from "../src/images/io";
import { generateImageFromAttributes } from "../src/images/generate";

const program = new Command()
  .description(
    "A worker used during parallel image generation. Do not run this directly."
  )
  .requiredOption("--startFrom <number>", "Start from a specific token ID")
  .requiredOption("--count <number>", "Number of tokens to render")
  .parse();

const options = program.opts();

async function main(startFrom: number, count: number) {
  const idsToRender: string[] = [];
  for (let i = startFrom; i < startFrom + count; i++) {
    idsToRender.push(i.toString());
  }

  const attributesToProcess = loadAttributesFromDisk(idsToRender);
  for (let i = 0; i < idsToRender.length; i++) {
    const tokenId = parseInt(idsToRender[i], 10);
    const attrSet = attributesToProcess[i];
    await generateImageFromAttributes(tokenId, attrSet);

    console.log(tokenId);
  }
}

main(Number(options.startFrom), Number(options.count)).then(() =>
  process.exit(0)
);
