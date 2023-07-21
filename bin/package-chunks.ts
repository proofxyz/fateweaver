import fs from "fs"
import { spawnSync } from "node:child_process"

const files = fs.readdirSync("./output/images")
const outputCount = files.length;

fs.mkdirSync("output/zip", {recursive: true})

let counter = 1;
let fileList: string[] = [];
for (let i = 0; i < outputCount; i++) {
  fileList.push(`output/images/${i}.png`);
  fileList.push(`output/json/${i}.json`);

  if (fileList.length === 2000 || i === outputCount - 1) {
    console.log("Writing Mythics_%s.zip", counter);
    spawnSync("zip", ["-j", `output/zip/Mythics_${counter++}`, ...fileList]);

    fileList = [];
  }
}