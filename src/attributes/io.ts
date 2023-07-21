import { globSync } from "glob";
import fs from "fs";
import { AttributeSet, NftMetadata } from "../types";
import {
  canonicalAttributeNameFromFile,
  extractAttributeName,
} from "./canonical";
import {
  optionalAttributes,
  optionalAttributesForSummary,
  traitProbabilities,
} from "../../config/attributes/definitions";
import { globToRegex } from "../glob";

export function loadAttributes(): string[] {
  const files = globSync("./assets/**/*.png");
  const attrSet: string[] = [];
  const attributes: Set<string> = new Set();

  const traitPatterns = Object.keys(traitProbabilities).map(globToRegex);

  for (const file of files) {
    const canonicalName = canonicalAttributeNameFromFile(file);

    // We check to see if the file has a corresponding trait probability. If it doesn't,
    // then we ignore it and continue.
    if (!traitPatterns.some((pattern) => pattern.test(canonicalName))) continue;

    const attribute = extractAttributeName(canonicalName);

    // If this is the first time we're encountering a particular attribute, and the
    // attribute is optional, add the special "None" trait value to the set.
    if (optionalAttributes.has(attribute) && !attributes.has(attribute)) {
      attrSet.push(`${attribute}/None`);
    }

    attributes.add(attribute);
    attrSet.push(canonicalName);
  }

  return attrSet;
}

export async function ensureOutputDir() {
  fs.mkdirSync("./output/internal", { recursive: true });
  fs.mkdirSync("./output/json", { recursive: true });
}

export function convertToNftMetadata(result: AttributeSet): NftMetadata {
  const attributes = Object.entries(result).map(([trait_type, value]) => ({
    trait_type,
    value,
  }));

  return {
    attributes,
  };
}

export function convertFromNftMetadata(metadata: NftMetadata): AttributeSet {
  return metadata.attributes.reduce(
    (acc, { trait_type, value }) => ({ ...acc, [trait_type]: value }),
    {}
  );
}

export function appendSeedHistory(seed: string) {
  fs.appendFileSync(
    "./output/seed-history.txt",
    `${seed}: ${new Date().toLocaleString()}\n`
  );
}

export function writeToDisk(
  version: "internal" | "final",
  tokenId: number,
  attributeSet: AttributeSet | NftMetadata
) {
  fs.writeFileSync(
    `./output/${version === "final" ? "json" : version}/${tokenId}.json`,
    JSON.stringify(attributeSet, null, 2)
  );
}

export function writeSummaryToDisk(
  allAttributes: string[],
  results: AttributeSet[]
) {
  writeAttributeCountsToDisk(allAttributes, results);
  writeAttributeTokenIndexToDisk(allAttributes, results);
  writeTraitCountsToDisk(results);
}

const traitWithoutVariant = (trait: string) => {
  const match = trait.match(/(^.+)\(.+\)$/);
  if (match) return match[1].trim();
};

function writeAttributeCountsToDisk(
  allAttributes: string[],
  results: AttributeSet[]
) {
  const unsortedRollups: Record<string, Record<string, number>> = {};
  const unsortedSummary = results.reduce((acc, result) => {
    Object.entries(result).forEach(([attribute, traitValue]) => {
      if (!acc[attribute]) {
        acc[attribute] = {};
      }

      if (!acc[attribute][traitValue]) {
        acc[attribute][traitValue] = 0;
      }

      acc[attribute][traitValue]++;

      const baseTrait = traitWithoutVariant(traitValue);
      if (baseTrait) {
        if (!unsortedRollups[attribute]) unsortedRollups[attribute] = {};
        if (!unsortedRollups[attribute][baseTrait])
          unsortedRollups[attribute][baseTrait] = 0;
        unsortedRollups[attribute][baseTrait]++;
      }
    });

    return acc;
  }, {} as Record<string, Record<string, number>>);

  const rollups: typeof unsortedRollups = {};
  for (const attribute in unsortedRollups) {
    rollups[attribute] = Object.fromEntries(
      Object.entries(unsortedRollups[attribute]).sort(([, a], [, b]) => b - a)
    );
  }

  for (const attribute of allAttributes) {
    const [attrName, traitName] = attribute.split("/");
    if (!unsortedSummary[attrName][traitName]) {
      unsortedSummary[attrName][traitName] = 0;
    }
  }

  const summary: typeof unsortedSummary = {};
  for (const attribute in unsortedSummary) {
    summary[attribute] = Object.fromEntries(
      Object.entries(unsortedSummary[attribute]).sort(([, a], [, b]) => b - a)
    );
  }

  fs.writeFileSync(
    `./output/attribute-counts.json`,
    JSON.stringify({ rollups, summary }, null, 2)
  );
}

function writeAttributeTokenIndexToDisk(
  allAttributes: string[],
  results: AttributeSet[]
) {
  const unsortedIndex = results.reduce((acc, result, tokenId) => {
    Object.entries(result).forEach(([attribute, trait_value]) => {
      if (!acc[attribute]) {
        acc[attribute] = {};
      }

      if (!acc[attribute][trait_value]) {
        acc[attribute][trait_value] = [];
      }

      acc[attribute][trait_value].push(tokenId);
    });

    return acc;
  }, {} as Record<string, Record<string, number[]>>);

  for (const attribute of allAttributes) {
    const [attrName, traitName] = attribute.split("/");
    if (!unsortedIndex[attrName][traitName]) {
      unsortedIndex[attrName][traitName] = [];
    }
  }

  const index: typeof unsortedIndex = {};
  for (const attribute in unsortedIndex) {
    index[attribute] = Object.fromEntries(
      Object.entries(unsortedIndex[attribute]).sort(([a], [b]) =>
        a.localeCompare(b)
      )
    );
  }

  fs.writeFileSync(
    `./output/attribute-token-index.json`,
    JSON.stringify(index, null, 2)
  );
}

type TraitCounts = {
  summary: Record<number, number>;
  tokens: Record<number, number[]>;
};

function writeTraitCountsToDisk(results: AttributeSet[]) {
  const traitCounts: TraitCounts = {
    summary: {},
    tokens: {},
  };

  for (let tokenId = 0; tokenId < results.length; tokenId++) {
    const result = results[tokenId];
    let traitCount = 0;

    for (const attribute of optionalAttributesForSummary) {
      const trait = result[attribute];
      if (trait !== "None") traitCount++;
    }

    traitCounts.summary[traitCount] =
      (traitCounts.summary[traitCount] || 0) + 1;

    traitCounts.tokens[traitCount] ||= [];
    traitCounts.tokens[traitCount].push(tokenId);
  }

  fs.writeFileSync(
    "./output/trait-counts.json",
    JSON.stringify(traitCounts, null, 2)
  );
}
