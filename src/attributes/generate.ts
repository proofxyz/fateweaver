import seedrandom from "seedrandom";
import { AttributeSet } from "../types";

import logger from "../logger";

import { createCanonicalName, extractTraitName } from "./canonical";
import {
  attributeOrder,
  optionalAttributes,
  traitProbabilities,
} from "../../config/attributes/definitions";
import { globToRegex } from "../glob";
import { transformInternalAttributes } from "../../config/attributes/transform";
import { RuleSet, mustNotPair, mustPair } from "../../config/attributes/rules";

// Create an array of tuples that stores the original trait definition and the
// regex version of it.
const traitProbabilityKeys: [string, RegExp][] = Object.keys(
  traitProbabilities
).map((trait) => [trait, globToRegex(trait)]);

/**
 * Generates a full attribute set.
 */
export function generateAttributeSet(
  canonicalTraits: string[],
  rng: seedrandom.PRNG
) {
  const attrMap: AttributeSet = {};

  for (const attribute of attributeOrder) {
    logger.debug(`Picking attribute: ${attribute}`);
    const allPossibleTraits = canonicalTraits.filter((attr) =>
      attr.startsWith(`${attribute}/`)
    );

    const originalWeight = calculateTotalWeightForTraits(allPossibleTraits);
    const possibleTraits = filterTraitsByRules(attrMap, allPossibleTraits);

    try {
      attrMap[attribute] = extractTraitName(
        pickTraitWithProbability(attribute, possibleTraits, originalWeight, rng)
      );
    } catch (e) {
      logger.error(`Existing attributes:`, attrMap);
      throw e;
    }
  }

  return transformInternalAttributes(attrMap);
}

function calculateTotalWeightForTraits(traits: string[]) {
  return traits.reduce((acc, trait) => {
    const matchedProbability = traitProbabilityKeys.find(([, regex]) =>
      regex.test(trait)
    );

    if (!matchedProbability) return acc;
    return acc + traitProbabilities[matchedProbability[0]];
  }, 0);
}

/**
 * Given a map of already chosen traits and a pool of possible traits for the current
 * attribute, filter the traits based on the defined rules.
 *
 * @param attrMap The currently picked set of traits
 * @param allPossibleTraits All possible traits for this attribute
 * @returns A list of filtered traits based on the rules
 */
function filterTraitsByRules(
  attrMap: AttributeSet,
  allPossibleTraits: string[]
) {
  // Convert the already picked attribute map to a list of canonical traits
  const alreadyPickedTraits = Object.entries(attrMap).map(([attr, trait]) =>
    createCanonicalName(attr, trait)
  );

  /**
   * This function is pretty gnarly but it's due to how the rules work. There is
   * probably a way to optimize this, but for our purposes, it works fine.
   */
  const filterByRuleSet = (
    currentPossibleTraits: string[],
    ruleSet: RuleSet,
    matcher: (trait: string, matchedRule: RegExp[]) => boolean
  ) => {
    const matchedRuleSet: RuleSet = [];

    // For each set of rules
    for (const ruleList of ruleSet) {
      // For each rule in the list
      for (const rule of ruleList) {
        // Is there an already picked trait that matches
        if (alreadyPickedTraits.some((trait) => rule.test(trait))) {
          // If so, is there a posssible trait for this attribute that also
          // matches a rule in the list
          for (const rule2 of ruleList) {
            // If yes, then we have a matching rule set that we must use to filter the
            // available list of traits.
            if (currentPossibleTraits.some((trait) => rule2.test(trait))) {
              matchedRuleSet.push(ruleList);
            }
          }
        }
      }
    }

    // We have matching rules, so let's filter the trait list
    if (matchedRuleSet) {
      logger.debug(`Matched rule set`, matchedRuleSet);

      return matchedRuleSet.reduce((acc, ruleList) => {
        return acc.filter((trait) => matcher(trait, ruleList));
      }, currentPossibleTraits);
    }

    // No matching rules, any trait is fine
    return currentPossibleTraits;
  };

  logger.debug("Must pair rules");
  const filteredByMustPair = filterByRuleSet(
    allPossibleTraits,
    mustPair,
    (trait, matchedRule) => matchedRule.some((rule) => rule.test(trait))
  );

  logger.debug("Must not pair rules");
  const filteredByMustNotPair = filterByRuleSet(
    filteredByMustPair,
    mustNotPair,
    (trait, matchedRule) => !matchedRule.some((rule) => rule.test(trait))
  );

  return filteredByMustNotPair;
}

/**
 * Given a list of possible traits, pick one based on the configured weights
 * @param possibleTraits The full list of canonical traits
 * @param rng The PRNG
 */
function pickTraitWithProbability(
  attribute: string,
  possibleTraits: string[],
  originalWeight: number,
  rng: seedrandom.PRNG
) {
  // A map of the full set of traits with their probabilities. This is necessary because
  // the trait probability definition supports glob-style matching.
  const fullTraitProbabilityMap: Record<string, number> = {};

  // Go through each possible trait and define a weight for it. This handles
  // the glob-style matching. For all traits matched via glob, the same probability will
  // be assigned to each.
  possibleTraits.forEach((trait) => {
    const matchedProbability = traitProbabilityKeys.find(([, regex]) =>
      regex.test(trait)
    );

    // If there are no matching probabilities, then this trait won't be selected
    if (!matchedProbability) {
      fullTraitProbabilityMap[trait] = 0;
      return;
    }

    fullTraitProbabilityMap[trait] = traitProbabilities[matchedProbability[0]];
  });

  logger.debug("Full trait probability map", fullTraitProbabilityMap);

  // Calculate the total weight of all possible traits
  const nonAdjustedWeight = possibleTraits.reduce((acc, trait) => {
    const probability = fullTraitProbabilityMap[trait];
    return acc + probability;
  }, 0);

  // If the attribute is optional, we adjust the weight of the None trait to maintain
  // the same probability of picking a trait after filtering rules are applied. If the
  // probability of None = 0, then we don't want to leave it as an option left to chance.
  let totalWeight: number;
  if (
    `${attribute}/None` in fullTraitProbabilityMap &&
    fullTraitProbabilityMap[`${attribute}/None`] > 0
  ) {
    const originalNoneWeight = fullTraitProbabilityMap[`${attribute}/None`];
    const adjustedNoneWeight =
      fullTraitProbabilityMap[`${attribute}/None`] +
      (originalWeight - nonAdjustedWeight);

    logger.debug(
      `Adjusting None weight from ${originalNoneWeight} -> ${adjustedNoneWeight}`
    );

    fullTraitProbabilityMap[`${attribute}/None`] = adjustedNoneWeight;
    totalWeight = originalWeight;
  } else {
    totalWeight = nonAdjustedWeight;
  }

  logger.debug(`Non-adjusted total weight: ${nonAdjustedWeight}`);
  logger.debug(`Original ${attribute} weight: ${originalWeight}`);
  logger.debug(`Total weight: ${totalWeight}`);

  // Generate a random threshold between 0 and the totalWeight
  const random = rng() * totalWeight;

  logger.debug(`Weight threshold: ${random}`);

  let sum = 0;
  let pickedTrait = "";
  for (const trait of possibleTraits) {
    sum += fullTraitProbabilityMap[trait];
    if (random <= sum) {
      // We've reached the random threshold, so pick this trait
      pickedTrait = trait;
      break;
    }
  }

  if (!pickedTrait) {
    // This makes life easier if we want to do something like this in the do not pair list:
    // ["Base/Spirit", "Outerwear/*"]
    //
    // In this case, Base=Spirit will always have Outerwear=None. Otherwise, we'd have to list
    // every Outerwear trait to prevent pairing. Although this example is bad becuase you could
    // also just do ["Base/Spirit", "Outerwear/None"] in the must pair list. Whatever. Options.
    if (optionalAttributes.has(attribute)) {
      return `${attribute}/None`;
    }

    // If the attribute is not optional, then we've encountered an issue with the rule definitions.
    console.error("Failed to pick trait for attribute:", attribute);
    console.error("Possible traits:", possibleTraits);
    console.error("Weight threshold:", random);
    console.error("Cumulative weight", sum);
    throw new Error("Unable to pick trait for attribute");
  }

  logger.debug(`Picked trait: ${pickedTrait}`);
  return pickedTrait;
}
