import { formatBlendRules } from "src/images/rules";

/**
 * This allows you to specify the blend mode to use when blending the asset with
 * layers below it. The default is "source-over". Rules are defined as a glob matching
 * pattern. Regex is currently not supported (coming soon). Example rule:
 *
 * ```
 * "Right Arm/Magic* (Glow)": "screen"
 * ```
 */
export const BLEND_MODE_RULES = formatBlendRules({});
