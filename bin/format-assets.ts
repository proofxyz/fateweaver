import { globSync } from "glob";
import fs from "fs";
import cliProgress from "cli-progress";

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

async function main() {
  const files = globSync("./assets/**/*.png");
  progressBar.start(files.length, 0);

  files.forEach((file) => {
    fs.renameSync(
      file,
      file
        .replace(/\/[\w|\s]+=/, "/")
        .replace("Grey", "Gray")
        .replace("Grasp", "Grip")
        .replace("RedYellow", "Red-Yellow")
        .replace("Tropicana", "Tropical")
        .replace("Cosmic", "Starlight")
        .replace(/Bruiser \((\w+)\)\.png$/, "$1.png")
        .replace("(Chill)", "(Snowbeast)")
        .replace("Angry", "Fierce")
    );

    progressBar.increment();
  });

  progressBar.stop();
}

main().then(() => process.exit(0));
