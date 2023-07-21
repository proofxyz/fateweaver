/**
 * The order in which attributes are picked during generation.
 */
export const attributeOrder: string[] = [];

/**
 * These attributes are not required to be picked. Make sure to set
 * a probability for the special "None" trait below in traitProbabilities.
 */
export const optionalAttributes = new Set<string>([]);

/**
 * This is very similar to above, but is solely used when generating the summary after attribute
 * generation. The attributes listed here are used to determine the "trait count" the NFT
 * has for analysis purposes.
 */
export const optionalAttributesForSummary: string[] = [];

/**
 * The probability of picking a trait for a given attribute. When using a glob
 * matching pattern, every trait that matches will have the same specified probability.
 * If a trait is not listed here, it will never be included in the final output.
 *
 * The weights here are relative to each other, but isolated to their specific attribute.
 * For example, if an attribute has 2 traits and they both have a probability value of 1,
 * then each trait has a 50% chance of being picked. You can use decimals and numbers < 1
 * if desired.
 */
export const traitProbabilities: Record<string, number> = {};
