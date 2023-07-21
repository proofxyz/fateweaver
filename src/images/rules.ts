import { EditableLayer, LayerSet } from "./layers";
import { LAYER_RULES } from "config/images/rules";
import { globToRegex } from "src/glob";

/**
 * Given an array of string matchers
 */
export function repeatImageRule(
  matchers: string[],
  func: (layers: LayerSet, layer: EditableLayer) => void
) {
  return Object.fromEntries(matchers.map((matcher) => [matcher, func]));
}

export function applyLayerRules(layerSet: LayerSet) {
  const newLayerSet = LayerSet.clone(layerSet);
  for (const layer of layerSet) {
    /**
     * Find the first rule that matches the layer's canonical name. We only allow
     * matching a single rule at this time.
     */
    const rule = (() => {
      for (const [ruleMatcher, rule] of LAYER_RULES) {
        if (ruleMatcher.test(layer.canonicalName)) {
          return rule;
        }
      }
    })();

    rule?.(newLayerSet, layer);
  }

  return newLayerSet;
}

export function formatImageRules(
  rules: Record<string, (layers: LayerSet, layer: EditableLayer) => void>
) {
  const newRules: Map<
    RegExp,
    (layers: LayerSet, layer: EditableLayer) => void
  > = new Map();

  for (const [key, value] of Object.entries(rules)) {
    newRules.set(globToRegex(key), value);
  }

  return newRules;
}

export function formatBlendRules(
  rules: Record<string, GlobalCompositeOperation>
) {
  const newRules: Map<RegExp, GlobalCompositeOperation> = new Map();
  for (const [key, value] of Object.entries(rules)) {
    newRules.set(globToRegex(key), value);
  }

  return newRules;
}
