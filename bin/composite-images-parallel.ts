import fs from "fs";
import { Command } from "@commander-js/extra-typings";

import { spawn } from "node:child_process";
import cliProgress from "cli-progress";
import { ensureOutputDir } from "../src/images/io";

const multibar = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
  },
  cliProgress.Presets.shades_grey
);

const program = new Command().requiredOption(
  "-n, --number <number>",
  "Number of parallel processes"
);

program.parse();
const options = program.opts();

async function main() {
  ensureOutputDir();

  const numThreads = Number(options.number);
  const totalCount = fs.readdirSync("./output/internal").length;
  const countPerProcess = Math.ceil(totalCount / numThreads);
  const progressBars: cliProgress.SingleBar[] = [];

  const workerPromises: Promise<unknown>[] = [];
  for (let i = 0; i < numThreads; i++) {
    const startFrom = i * countPerProcess;
    const endOn = Math.min(startFrom + countPerProcess - 1, totalCount - 1);
    const count = endOn - startFrom + 1;
    progressBars.push(multibar.create(count, 0));

    console.log("Worker %s: %s -> %s", i, startFrom, endOn);
    workerPromises.push(startWorker(startFrom, count, progressBars[i]));
  }

  await Promise.all(workerPromises);

  progressBars.forEach((bar) => bar.stop());
}

async function startWorker(
  startFrom: number,
  count: number,
  progressBar: cliProgress.SingleBar
) {
  return new Promise((resolve, reject) => {
    const process = spawn("node", [
      "./dist/bin/composite-images-worker.js",
      "--startFrom",
      String(startFrom),
      "--count",
      String(count),
    ]);

    process.stdout.on("data", () => {
      progressBar.increment();
    });

    process.stderr.on("data", (data: Buffer) => {
      console.error(data.toString("utf-8"));
    });

    process.on("close", (code: number) => {
      if (code === 0) {
        resolve(0);
      } else {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

main().then(() => process.exit(0));
