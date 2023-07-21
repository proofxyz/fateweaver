import fs from "fs";
import { createCanvas, loadImage } from "canvas";
import logger from "../logger";
import { AttributeSet } from "../types";
import { processAttributesToLayers } from "./layers";
import { BLEND_MODE_RULES } from "../../config/images/blending";

export async function generateImageFromAttributes(
  tokenId: number,
  attrSet: AttributeSet,
  size?: number
) {
  logger.debug("Compositing tokenId:", tokenId);

  const layers = processAttributesToLayers(attrSet);

  logger.debug(
    "Layer order:",
    layers.get().map((layer) => layer.canonicalName)
  );

  const canvas = createCanvas(size || 2400, size || 2400);
  const ctx = canvas.getContext("2d");

  await Promise.all(
    layers.get().map(async (layer) => {
      const image = await loadImage(layer.file);
      const blend = (() => {
        for (const [regex, blend] of BLEND_MODE_RULES) {
          if (regex.test(layer.canonicalName)) return blend;
        }

        return "source-over";
      })() as GlobalCompositeOperation;

      logger.debug("Blending", layer.canonicalName, "with", blend);

      ctx.globalCompositeOperation = blend;
      ctx.drawImage(image, 0, 0, size || 2400, size || 2400);
    })
  );

  await new Promise((resolve) => {
    const out = fs.createWriteStream(`./output/images/${tokenId}.png`);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", resolve);
  });
}
