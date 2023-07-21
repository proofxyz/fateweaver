import { globToRegex } from "../glob";

/**
 * Formats the RuleSet so that all of the rules are regex.
 */
export function formatRuleSet(ruleSet: (string | RegExp)[][]) {
  return ruleSet.map((ruleList) =>
    ruleList.map((rule) => {
      if (rule instanceof RegExp) return rule;
      return globToRegex(rule);
    })
  );
}
