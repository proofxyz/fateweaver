import { AttributeSet } from "../../src/types";

/**
 * This function is called after a full attribute set has been generated. It allows you to
 * transform the attributes in any way you want for the *internal* metadata. This is primarily
 * to prepare for the image generation pipeline. For example, you could combine multiple traits
 * into a single one in order to match the format of your assets.
 */
export function transformInternalAttributes(
  attrSet: AttributeSet
): AttributeSet {
  return attrSet;
}

/**
 * This allows you to transform your *final* set of attributes. This is useful if you want to remove
 * certain traits or combine the names of traits to be included in the public facing metadata.
 */
export function processFinalAttributeSet(attrSet: AttributeSet): AttributeSet {
  // You're going to want to clone the object first, otherwise you'll be modifying the original with
  // unintended consequences.
  const output = { ...attrSet };

  // This is an example, you don't need to remove your "None" traits if you don't want to.
  return removeNoneTraits(output);
}

function removeNoneTraits(output: AttributeSet): AttributeSet {
  return Object.fromEntries(
    Object.entries(output).filter(([, trait]) => trait !== "None")
  );
}
