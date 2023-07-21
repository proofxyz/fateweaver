import fs from "fs";
import { globSync } from "glob";
import sharp from "sharp";
import {
  canonicalAttributeNameFromFile,
  extractAttributeName,
  extractTraitName,
} from "./src/attributes/canonical";
import {
  attributeOrder,
  globToRegex,
  traitProbabilities,
} from "./src/attributes/rules";

// 4x export
const IMAGE_SIZE = 2400;
const files = globSync("./assets/**/*.png");

const MANNEQUIN_LAYERS = [
  "Accessory (Body BG)",
  "Accessory (Body FG)",
  "Accessory (Shoulder)",
  "Accessory (Wing BG)",
  "Accessory (Wing FG)",
  "Base",
  "Beak",
  "Eyes",
  "Headwear",
  "Outerwear",
  "Pattern",
];

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

    if (!file.includes("Mannequin")) {
      test("is the correct size", async () => {
        const image = sharp(file);
        const metadata = await image.metadata();

        expect(metadata.width).toBe(IMAGE_SIZE);
        expect(metadata.height).toBe(IMAGE_SIZE);
      });
    }

    // Disabled because I know at this point that they all don't have a red border, and some backgrounds
    // legitimately have red = 255.
    // test("does not have a red border", async () => {
    //   // This file legitimately has red = 255 at the top corner
    //   if (file.endsWith("Dusk.png")) return;

    //   const buffer = await sharp(file)
    //     .extract({ left: 0, top: 0, width: 1, height: 1 })
    //     .extractChannel("red")
    //     .raw()
    //     .toBuffer();

    //   expect(buffer.at(0)).not.toBe(255);
    // });

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

    if (MANNEQUIN_LAYERS.includes(attribute)) {
      test("has a mannequin image", () => {
        const [attribute, trait] = canonicalName.split("/");
        expect(
          fs.existsSync(`./assets/Mannequins/${attribute}/${trait}.png`)
        ).toBe(true);
      });
    }

    if (
      ["Front Wing", "Rear Wing"].includes(extractAttributeName(canonicalName))
    ) {
      describe(extractAttributeName(canonicalName), () => {
        test("is named correctly", () => {
          expect(extractTraitName(canonicalName)).toMatch(
            /^.+\s\((Down|Grip|Open)\)$/
          );
        });
      });
    }
  });
}
