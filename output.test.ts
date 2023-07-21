import fs from "fs";
import crypto from "crypto";

import { NftMetadata } from "./src/types";

const outputFiles = fs.readdirSync("./output/internal");
const fileHashes = Object.fromEntries(
  outputFiles.map((file) => {
    const buff = fs.readFileSync(`./output/internal/${file}`, {
      encoding: "utf-8",
    });

    const data: NftMetadata = JSON.parse(buff);

    // If you want to delete an attribute from the hash calculation,
    // you could do that here.
    // delete data.attributes[data.attributes.length - 1];

    return [
      file,
      crypto.createHash("md5").update(JSON.stringify(data)).digest("hex"),
    ];
  })
);

for (const file of outputFiles) {
  describe(`Output ${file}`, () => {
    test("has a unique set of attributes", () => {
      expect(
        Object.values(fileHashes).filter((hash) => hash === fileHashes[file])
          .length
      ).toBe(1);
    });
  });
}
