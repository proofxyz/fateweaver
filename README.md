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

- **Attribute:** a specific layer on the NFT, e.g. Body, Front Wing, etc.
- **Trait:** a specific attribute value, e.g. Red, Blue, etc.
- **Attribute set:**: the set of all attributes that makes up an NFT.
- **Canonical name:** a single string that defines an attribute and trait pair, separated with a "/". For example, `Body/Red`.
- **PRNG**: pseudo-random number generator. This is the source of randomness used to generate the collection. It can be seeded with any string you want, and will always produce the same result given the same seed.

## Organizing your assets

One important caveat with Fateweaver is, at this point in time, **all assets must have a square aspect ratio**. Fateweaver was originally built to generate PFP collections, so this was a natural constraint. It's possible support for non-square assets will be added in the future. You will also probably want your assets to be the same size, although they will get resized to fit the canvas when rendered.

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

## Attribute config

All attribute related configuration is in the folder `config/attributes`. There is extensive documentation in each file, but to get started, you'll need to:

1. Define the attributes you want to include as a part of your NFT metadata in the order that you want them to be picked.
2. Specify which attributes, if any, can be optional. In other words, which attributes can be assigned a "None" trait.
3. Define the probability of each trait being picked.
4. Create trait rules that can be used to require or prevent two or more traits to be paired together.

## Attribute generation

Attribute generation happens in a series of steps to produce the final output:

1. Create a PRNG using either a provided or random seed.
2. Load all attributes and traits via scanning the assets folder on disk, filtering out any assets that don't have a corresponding trait probability defined.
3. For N number of times, generate a random attribute set.
   1. For each attribute in the defined order...
      1. Filter the list of available traits based on the defined rules and previously selected traits.
      2. Pick a trait at random from the filtered list using the configured weights.
   2. Write the internal attribute set to disk with the current token ID.
   3. Write the final attribute set to disk after running it through the transformer.

## Image config

All image related configuration is in the folder `config/images`. Like attributes, there is documentation in each file to help you along.

There is only 1 image config that is required, which is defining the layer order in `config/images/layers.ts`. This is a list of the attributes you want to render to the final image ordered from back to front. But don't worry, this layer order isn't set in stone. You can override it using the image rules config in `config/images/rules.ts`.

## Running fateweaver

Once you have your configuration set up, you can build the project with `yarn build`. You can also run `yarn dev` and it will automatically rebuild any time you make a change.

As mentioned previously, generating a collection happens in 2 stages. To generate a set of 100 metadata outputs, run:

```
yarn generate-attributes -n 100
```

This will create a folder called `output` and write the metadata to it. The `output/internal` folder is the metadata before any transformations, and `output/json` is the final output after transformations. This command will also automatically generate a set of summaries for you so you can easily see the current state of the collection at a high level. Finally, it will also create a file called `output/seed-history.txt`. This keeps track of what seed was given to the PRNG on every run, so if you want to re-generate the collection using the same seed, you can do so by running:

```
# To re-use the seed from the last run
yarn generate-attributes -n 100 -s last

# Or to use a specific seed
yarn generate-attributes -n 100 -s d1ec190b-00b1-40e8-9a31-285205a26643
```

Once you're happy with the metadata, you can generate the images by running:

```
yarn composite-images
```

This will render all of the images at full size into `output/images`. One commonly used option is to resize the output while iterating, especially if you are working with large assets. To do this, you can use the `-s` option:

```
yarn composite-images -s 1024
```

If you have a large collection, you can speed up the render process by using the parallelized renderer. You have to specify how many workers you want to render at the same time, so I recommend using the number of threads your CPU can handle and subtract 1 or 2. For example, on an M1 Macbook Pro, I would recommend 8 workers:

```
yarn composite-images-parallel -n 8
```

### Command reference

Here's a list of all the commands you can run with Fateweaver:

| Command                          | Description                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `yarn build`                     | Build the project.                                                                                                         |
| `yarn dev`                       | Build the project and watch for changes.                                                                                   |
| `yarn generate-attributes`       | Generate a set of attributes and write them to disk.                                                                       |
| `yarn composite-images`          | Render the generated attributes into images.                                                                               |
| `yarn composite-images-parallel` | Render the generated attributes into images using multiple workers.                                                        |
| `yarn calculate-summary`         | Summaries are automatically generated after attribute generation, but you can manually re-generate them with this command. |
| `yarn clean`                     | Delete all contents of the output folder.                                                                                  |
| `yarn clean:images`              | Delete only the images in the output folder.                                                                               |
| `yarn search`                    | Search the collection metadata for tokens that match all of the given traits.                                              |
| `yarn regenerate-duplicates`     | Scan the collection to find duplicates and re-generate them until none remain.                                             |
| `yarn reprocess-metadata`        | Run the internal metadata through your transformers to re-create the final metadata output.                                |
| `yarn rerender-updated-tokens`   | Using git, re-render only the outputs that have changed since the last commit.                                             |
| `yarn package`                   | Package the entire output (images and final metadata) into a single ZIP file.                                              |
| `yarn package:chunks`            | Package the output into multiple ZIP files, each containing a chunk of the collection.                                     |
| `yarn test`                      | Run the test suite against your assets and output.                                                                         |

## Running tests

Fateweaver comes with a short set of tests that you can use to make sure everything is working as expected. They can be run by simply running `yarn test`. The built-in tests will check:

1. Do you have assets defined?
2. Do your assets (that are expected to be picked as a trait) have a trait probability defined?
3. Does an asset match 1 and only 1 trait rule?
4. Does the generated metadata have any duplicates?

If you want, you can add more tests to check the output of your collection as you go!
