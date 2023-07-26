import { formatImageRules } from "../../src/images/util";

/**
 * Every output consists of a set of layers. Each layer is a single asset that is composited
 * on top of another in a specific order. The layering system allows you to move layers and
 * insert new layers as well as edit layer properties in order to achieve the desired output.
 *
 * Image rules are defined as a glob-style pattern matching the layer's canonical
 * name and a function that receives the full layer set as well as the layer that was
 * matched by the rule. For example:
 *
 * ```
 * "Headwear/Cowboy Hat": (layers, hat) => {
 *  // Do something with the layer set and the matched layer
 *   if (layers.has("Outerwear/Space Suit")) {
 *     layers.moveAfter(hat, "Outerwear")
 *   }
 * }
 * ```
 *
 * There are a handful of helper functions that let you modify the layer set:
 *
 * * `insertBefore(existingAttribute, newAttribute)`
 * * `insertAfter(existingAttribute, newAttribute)`
 * * `moveBefore(layerToMove, attribute)`
 * * `moveAfter(layerToMove, attribute)`
 * * `remove(attribute)`
 * * `has(search)`
 * * `find(search)`
 */
export const LAYER_RULES = formatImageRules({});
