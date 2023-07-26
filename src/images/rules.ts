import { LayerSet } from "./layers";
import { LAYER_RULES } from "../../config/images/rules";

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
