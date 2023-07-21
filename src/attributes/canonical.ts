/**
 * The canonical attribute name is the [attribute]/[trait name] as a single
 * string.
 */
export function canonicalAttributeNameFromFile(file: string) {
  return file.replace("assets/", "").replace(".png", "");
}

export function extractAttributeName(attribute: string) {
  return attribute.split("/")[0];
}

export function extractTraitName(attribute: string) {
  return attribute.split("/")[1];
}

export function createCanonicalName(attribute: string, trait: string) {
  return `${attribute}/${trait}`;
}
