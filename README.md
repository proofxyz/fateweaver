# Fateweaver

This project includes scripts that can be used to randomly generate a NFT collection given a set of rules. It handles both the metadata generation and the actual image creation. Some notable features include:

- **Deterministic:** it uses a PRNG that can be seeded with whatever string you want. Every time you generate a collection using the same seed, you will always get the same result.
- **Flexible trait rules:** trait pairing rules can be defined as either "must pair" or "do not pair" rules. When used together, it's possible to handle most trait pairing restrictions. The rules support a simple glob-style pattern matching that handle most cases, but if needed, you can switch to regex.
- **Simplicity:** your asset file structure defines the trait naming conventions throughout. All traits are defined as `[attribute]/[trait]`.
- **Powerful image compositing:** images can have their own set of rules matched against specific traits. You can use these rules to insert additional assets, move layers, and even set the blending mode of the layer.
- **Speed:** images can be rendered in parallel to significantly speed up generating larger collections. For example, a 37,000 output collection can be rendered in as little as 1 hour depending on your hardware.
- **Duplicate avoidance:** a script is provided that searches the collection for duplicates and allows you to re-generate those tokens until no duplicates are left.
- **Helpful summaries:** generating attributes will create summaries for you so you can see the current state of the collection from a high level.

## Scripts

All scripts can be run via npm or yarn.

TODO

## Important terminology

- Attribute: a specific layer on the Mythic, e.g. Body, Front Wing, etc.
- Attribute set: the set of all attributes that makes up a Mythic
- Trait: a specific attribute value, e.g. Front Wing/White (Down)
- RuleSet: a set of all matching rules, defined as `RegExp[][]`
- RuleList: a single list of rules, defined as `RegExp[]`

## Attribute generation

Attribute generation happens in a series of steps to produce the final output:

1. Create a PRNG using either a provided or random seed.
2. Load all attributes and traits via scanning the assets folder on disk. Each folder represents an attribute, and all of the images inside represent the available traits. A trait must have a defined probability as well in order to be included.
3. For N number of times, generate a random attribute set.
   1. Starting with the base, pick a random one based on the defined probabilities.
   2. From there, pick random traits (based on the exclusion/inclusion lists) for the rest of the attributes in the defined order.
   3. Write the attribute set to disk with the current token ID.
