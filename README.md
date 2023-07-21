# Fateweaver

This project includes scripts that can be used to randomly generate a NFT collection given a set of rules. It handles both the metadata generation and the actual image creation. Some notable features include:

- **Deterministic:** it uses a PRNG that can be seeded with whatever string you want. Every time you generate a collection using the same seed, you will always get the same result.
- **Flexible trait rules:** trait pairing rules can be defined as either "must pair" or "do not pair" rules. When used together, it's possible to handle most trait pairing restrictions. The rules support a simple glob-style pattern matching that handle most cases, but if needed, you can switch to regex.
- **Simplicity:** your asset file structure defines the trait naming conventions throughout. All traits are defined as `[attribute]/[trait]`.
- **Powerful image compositing:** images can have their own set of rules matched against specific traits. You can use these rules to insert additional assets, move layers, and even set the blending mode of the layer.
- **Speed:** images can be rendered in parallel to significantly speed up generating larger collections. For example, a 37,000 output collection can be rendered in as little as 1 hour depending on your hardware.
- **Duplicate avoidance:** a script is provided that searches the collection for duplicates and allows you to re-generate those tokens until no duplicates are left.
- **Helpful summaries:** generating attributes will create summaries for you so you can see the current state of the collection from a high level.

## Important terminology

- Attribute: a specific layer on the NFT, e.g. Body, Front Wing, etc.
- Attribute set: the set of all attributes that makes up an NFT.
- Trait: a specific attribute value, e.g. Red, Blue, etc.
- Canonical name: a single string that defines an attribute and trait pair, separated with a "/". For example, `Body/Red`.
- RuleSet: a set of all matching rules, defined as `RegExp[][]`
- RuleList: a single list of rules, defined as `RegExp[]`

## Organizing your assets

The structure of your assets folder is important. Each folder inside the `assets` folder represents an attribute, and all of the images inside represent the available traits. A trait must have a defined probability as well in order to be included. It's okay to have additional folders and files that aren't traits, e.g. additional assets to support an actual trait.

A folder structure might look like this:

```
/assets
├── /Body
│   ├── Blue.png
│   ├── Green.png
├── /Headwear
│   ├── Baseball Cap.png
│   ├── Cowboy Hat.png
│   ├── Wizard Hat.png
```

This would mean we have the following canonical names to work with:

```
Body/Blue
Body/Green
Headwear/Baseball Cap
Headwear/Cowboy Hat
Headwear/Wizard Hat
```

## Attribute generation

Attribute generation happens in a series of steps to produce the final output:

1. Create a PRNG using either a provided or random seed.
2. Load all attributes and traits via scanning the assets folder on disk.
3. For N number of times, generate a random attribute set.
   1. For each attribute in the defined order...
      1. Filter the list of available traits based on the defined rules and previously selected traits.
      2. Pick a trait at random from the filtered list using the configured weights.
   2. Write the internal attribute set to disk with the current token ID.
