import { globToRegex } from "../glob";
import {
  createCanonicalName,
  extractAttributeName,
} from "../attributes/canonical";

import logger from "../logger";
import { AttributeSet } from "../types";
import { applyLayerRules } from "./rules";
import { LAYER_ORDER } from "../../config/images/layers";

export type EditableLayer = {
  attribute: string;
  canonicalName: string;
  file: string | null;
};

export type Layer = Omit<EditableLayer, "file"> & { file: string };

export class LayerSet {
  private layers: EditableLayer[];

  static clone(layerSet: LayerSet) {
    const clone = new LayerSet({});
    clone.layers = [...layerSet.layers];
    return clone;
  }

  constructor(attrSet: AttributeSet) {
    this.layers = LAYER_ORDER.map((attribute) => {
      const file = resolveFilename(attribute, attrSet[attribute]);
      return {
        attribute: attribute,
        canonicalName: createCanonicalName(attribute, attrSet[attribute]),
        file,
      };
    });
  }

  /**
   * Be careful using this as it could potentially cause your find() queries to
   * return undefined for entire attributes.
   */
  remove(attribute: string) {
    logger.debug(`Removing ${attribute}`);
    this.layers = this.layers.filter((layer) => layer.attribute !== attribute);
  }

  insertBefore(attribute: string, newCanonicalAttr: string) {
    logger.debug(`Insert ${newCanonicalAttr} before ${attribute}`);

    const index = this.layers.findIndex(
      (layer) => layer.attribute === attribute
    );

    const file = `./assets/${newCanonicalAttr}.png`;

    const newLayer: Layer = {
      attribute: extractAttributeName(newCanonicalAttr),
      canonicalName: newCanonicalAttr,
      file,
    };

    this.layers.splice(index, 0, newLayer);

    return newLayer;
  }

  insertAfter(attribute: string, newCanonicalAttr: string) {
    logger.debug(`Insert ${newCanonicalAttr} after ${attribute}`);

    const index = this.layers.findIndex(
      (layer) => layer.attribute === attribute
    );

    const file = `./assets/${newCanonicalAttr}.png`;

    const newLayer: Layer = {
      attribute: extractAttributeName(newCanonicalAttr),
      canonicalName: newCanonicalAttr,
      file,
    };

    this.layers.splice(index + 1, 0, newLayer);

    return newLayer;
  }

  moveBefore(layerToMove: EditableLayer, attribute: string) {
    logger.debug(`Moving ${layerToMove.canonicalName} before ${attribute}`);

    const index = this.layers.findIndex(
      (layer) => layer.canonicalName === layerToMove.canonicalName
    );

    this.layers.splice(index, 1);

    const targetIndex = this.layers.findIndex(
      (layer) => layer.attribute === attribute
    );

    this.layers.splice(targetIndex, 0, layerToMove);
  }

  moveAfter(layerToMove: EditableLayer, attribute: string) {
    logger.debug(`Moving ${layerToMove.canonicalName} after ${attribute}`);

    const index = this.layers.findIndex(
      (layer) => layer.canonicalName === layerToMove.canonicalName
    );

    this.layers.splice(index, 1);

    const targetIndex = this.layers.findIndex(
      (layer) => layer.attribute === attribute
    );

    this.layers.splice(targetIndex + 1, 0, layerToMove);
  }

  has(search: string | RegExp) {
    return this.find(search) !== undefined;
  }

  find(search: string | RegExp) {
    const regex = search instanceof RegExp ? search : globToRegex(search);
    return this.layers.find((layer) => regex.test(layer.canonicalName));
  }

  get(): Layer[] {
    return this.layers.filter(
      (layer): layer is Layer =>
        !layer.canonicalName.endsWith("/None") && layer.file !== null
    );
  }

  [Symbol.iterator]() {
    let index = 0;
    const layers = this.get();

    return {
      next: () => {
        const done = index === layers.length;
        const value = layers[index++];

        return {
          value,
          done,
        };
      },
    };
  }
}

export function processAttributesToLayers(attrSet: AttributeSet) {
  const layerSet = new LayerSet(attrSet);
  return applyLayerRules(layerSet);
}

function resolveFilename(attribute: string, trait: string) {
  return `./assets/${attribute}/${trait}.png`;
}
