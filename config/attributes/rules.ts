/**
 * This file contains the rules for how traits interact with each other. It lets you define
 * both "mustPair" and "mustNotPair" rules that, when used together, should cover most situations.
 *
 * A single rule consists of an array of matching patterns. These patterns can be either a string,
 * which supports a simple glob-style matching pattern, or a RegExp, if you need more flexibility.
 */
import { formatRuleSet } from "../../src/attributes/rules";

export type RuleSet = RegExp[][];

/**
 * If one trait in a set is picked, then all the other traits for unchosen attributes must
 * also be picked. All matching rules will be used to filter the available trait list.
 * For example, a rule that looks like this:
 *
 * ```
 * ["Base/Wooden", "Front Arm/Wooden*", "Back Arm/Wooden*"]
 * ```
 *
 * would always pair together a wooden base with wooden arms. However, there are some nuances here to
 * be aware of. This doesn't prevent, say, a Metal base from receiving a Wooden arm. In order to do that,
 * you'll need an accompanying rule in the mustNotPair list below or a similar set of rules for the Metal arm.
 * Also, be conscious of the order in which traits are picked. All filtering is done based on the set of traits
 * that have already been picked.
 */
export const mustPair: RuleSet = formatRuleSet([]);

/**
 * If one trait in a set is picked, then all the other traits for unchosen attributes cannot
 * be picked. All matching rules will be used to filter the available trait list. Be careful
 * with this as it can be very unintuitive if you start combining more than 2 attributes. For example,
 * a rule that looks like this:
 *
 * ```
 * ["Base/Wooden", "Headwear/Metal Hat", "Footwear/Metal Boots"]
 * ```
 *
 * would certainly prevent the Wooden base from getting a Metal hat or boots, but it would also prevent any other
 * NFT that has a Metal Hat from getting Metal Boots, irregardless of the Base. In situations like this, it's better
 * to use multiple rules, like this:
 *
 * ```
 * ["Base/Wooden", "Headwear/Metal Hat"],
 * ["Base/Wooden", "Footwear/Metal Boots"]
 * ```
 *
 * This prevents the Wooden base from getting either Metal trait, but doesn't exclude the Metal traits from each other.
 */
export const mustNotPair: RuleSet = formatRuleSet([]);
