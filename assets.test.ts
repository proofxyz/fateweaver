import { globSync } from "glob";

import {
  canonicalAttributeNameFromFile,
  extractAttributeName,
  extractTraitName,
} from "./src/attributes/canonical";
import {
  attributeOrder,
  traitProbabilities,
} from "config/attributes/definitions";
import { globToRegex } from "src/glob";

const files = globSync("./assets/**/*.png");

const traitProbabilityKeyRegex = Object.keys(traitProbabilities).map((trait) =>
  globToRegex(trait)
);

test("assets are present", () => {
  expect(files.length).toBeGreaterThan(0);
});

for (const file of files) {
  describe(file, () => {
    const canonicalName = canonicalAttributeNameFromFile(file);
    const attribute = extractAttributeName(canonicalName);

    // If you want to disable a trait but leave it around for now, prefix it with an underscore.
    if (extractTraitName(canonicalName).startsWith("_")) return;

    // We filter this only on attributes that are explicitly chosen as a part of the trait
    // picking process, otherwise we'll get false positives for the additional assets that are included
    // with certain traits.
    if (attributeOrder.includes(attribute)) {
      test("is represented in the trait rules", () => {
        const matchedTrait = traitProbabilityKeyRegex.find((regex) =>
          regex.test(canonicalName)
        );

        expect(matchedTrait).toBeDefined();
      });

      test("does not match multiple trait rules", () => {
        const matchedTrait = traitProbabilityKeyRegex.filter((regex) =>
          regex.test(canonicalName)
        );

        // <= so we don't get duplicate errors if the trait is missing altogether from the rules
        expect(matchedTrait.length).toBeLessThanOrEqual(1);
      });
    }
  });
}
