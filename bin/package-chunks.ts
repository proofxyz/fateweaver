import { Command } from "@commander-js/extra-typings";
import fs from "fs";
import { spawnSync } from "node:child_process";

const program = new Command()
  .description(
    "Package the metadata and image outputs into ZIP files in chunks"
  )
  .requiredOption("-n, --number <number>", "The number of outputs per ZIP file")
  .parse();

const options = program.opts();
const CHUNK_SIZE = Number(options.number);

const files = fs.readdirSync("./output/images");
const outputCount = files.length;

fs.mkdirSync("output/zip", { recursive: true });

let counter = 1;
let fileList: string[] = [];
for (let i = 0; i < outputCount; i++) {
  fileList.push(`output/images/${i}.png`);
  fileList.push(`output/json/${i}.json`);

  if (fileList.length === CHUNK_SIZE || i === outputCount - 1) {
    console.log("Writing Collection_%s.zip", counter);
    spawnSync("zip", ["-j", `output/zip/Collection_${counter++}`, ...fileList]);

    fileList = [];
  }
}
