import { spawnSync } from "child_process";
import cliProgress from "cli-progress";
import { generateImageFromAttributes } from "../src/images/generate";
import { loadAttributesFromDisk } from "../src/images/io";
import logger from "../src/logger";

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

async function main() {
  // Use git to find all files in output/internal/ that have been updated
  const gitOutput = spawnSync("git", [
    "status",
    "--porcelain",
    "./output/internal",
  ]);

  const idsToRender = gitOutput.stdout
    .toString("utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("M") || line.startsWith("A"))
    .map(
      (line) => line.split(" ")[1].match(/output\/internal\/(\d+)\.json/)?.[1]
    )
    .filter((id): id is string => id !== undefined);

  logger.info("Rerendering tokens:", idsToRender);

  if (idsToRender.length === 0) return;

  const attributesToProcess = loadAttributesFromDisk(idsToRender);

  progressBar.start(idsToRender.length, 0);

  for (let i = 0; i < idsToRender.length; i++) {
    const tokenId = parseInt(idsToRender[i], 10);
    const attrSet = attributesToProcess[i];
    await generateImageFromAttributes(tokenId, attrSet, undefined);
    progressBar.increment();
  }

  progressBar.stop();
}

main().then(() => process.exit(0));
