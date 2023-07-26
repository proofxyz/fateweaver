import { EditableLayer, LayerSet } from "./layers";
import { globToRegex } from "../glob";

/**
 * Given an array of string matchers
 */
export function repeatImageRule(
  matchers: string[],
  func: (layers: LayerSet, layer: EditableLayer) => void
) {
  return Object.fromEntries(matchers.map((matcher) => [matcher, func]));
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
