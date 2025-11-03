// Simple in-code manifest to avoid static-file issues.
// Edit this list to match the exact filenames (with extensions) under public/refs/
export type ManifestEntry = {
  file: string;      // e.g. "black-tee-skull.jpg" (must include extension)
  replace: string;   // e.g. "side emblem next to skull"
};

export const REFS_MANIFEST: ManifestEntry[] = [
  // ▼ EXAMPLES — replace with your real files
    {
    file: "536000820_18084508084870705_1863751485079456271_n.png",
    replace: "metal engine behind skull"
  },
  {
    file: "532324876_18083609578870705_7786025600770441868_n.png",
    replace: "skull"
  },
  {
    file: "520941856_18082385257870705_3068542842883755053_n.png",
    replace: "cards and chips"
  },
  {
    file: "491416516_18073621093870705_1553309421817675182_n.png",
    replace: "skulls on floor"
  },
  {
    file: "491415021_18072545323870705_8507131698627680283_n.png",
    replace: "car"
  },
  {
    file: "490757356_18072793927870705_5264794875672410706_n.png",
    replace: "dragon"
  },
 {
    file: "483086357_18068930341870705_8434049462797539537_n.png",
    replace: "skull"
  },
 {
    file: "477528558_18067213492870705_5202122066376182871_n.png",
    replace: "image"
  },
 {
    file: "476075948_18066024388870705_4787732589082743204_n.png",
    replace: "globe"
  },

  // Add more like:
  // { file: "vintage-shirt.png",    replace: "graphic emblem below chest text" },
  // { file: "tee-logo-front.jpg",   replace: "small logo on chest" }
];