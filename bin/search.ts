import { Command, Option } from "@commander-js/extra-typings";
import { globToRegex } from "src/glob";

import { loadAttributesFromDisk } from "src/images/io";
import logger from "src/logger";

const program = new Command()
  .description(
    "Given a list of traits, find all of the tokens that include every trait"
  )
  .requiredOption("-t, --traits [traits...]")
  .addOption(
    new Option("-f, --format <string>", "Output format")
      .choices(["json", "list"])
      .default("json")
  )
  .parse();

const options = program.opts();

function main() {
  if (options.traits === true) return;
  const searchQueries = options.traits.map((cName) => {
    const [attribute, trait] = cName.split("/");
    return [attribute, globToRegex(trait)] as const;
  });

  logger.debug("Query:", searchQueries);

  const results: string[] = [];

  const attributes = loadAttributesFromDisk();
  for (const index in attributes) {
    const attrSet = attributes[index];
    const isMatch = (() => {
      for (const [attr, query] of searchQueries) {
        if (!query.test(attrSet[attr])) return false;
      }

      return true;
    })();

    if (isMatch) results.push(index);
  }

  if (options.format === "json") {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(results.join(" "));
  }
}

main();
