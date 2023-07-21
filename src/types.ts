export type AttributeSet = Record<string, string>;

export type NftMetadata = {
  attributes: NftAttribute[];
};

type NftAttribute = {
  trait_type: string;
  value: string | number;
};

export type TraitRule = string | RegExp;
