/**
 * Rudimentary glob-style matching. Changes * to .* and escapes parentheses.
 */
export function globToRegex(input: string) {
  return new RegExp(`^${globToRegexStr(input)}$`);
}

function globToRegexStr(input: string) {
  return input.replace(/\*/g, ".*").replace(/[()]/g, "\\$&");
}
