// Exact, case-sensitive filenames from /public/refs go here.
// Key = the file name (including extension). Values = what to replace and what to keep.
//
// TIP: First deploy the /api/refs endpoint below and visit /api/refs in your browser
// to see the exact filenames. Then paste them here.

export type ManifestEntry = { replace: string; keep: string };

export const REFS_MANIFEST: Record<string, ManifestEntry> = {
  // EXAMPLES — replace these with your real files:
"536000820_18084508084870705_1863751485079456271_n.png": {replace: "metal engine behind skull", keep: "skull and fire"},
"532324876_18083609578870705_7786025600770441868_n.png": {replace: "skull", keep: "purple and red cobra snake"},
"520941856_18082385257870705_3068542842883755053_n.png": {replace: "cards and chips", keep: "chrome revolver silhouette and orange glow"},
"491416516_18073621093870705_1553309421817675182_n.png": {replace: "skulls on floor", keep: "hooded figure and crossed emblem"},
"491415021_18072545323870705_8507131698627680283_n.png": {replace: "car", keep: "city background and border chains"},
"490757356_18072793927870705_5264794875672410706_n.png": {replace: "golden dragon", keep: "samurai and energy blade motif"},
"483086357_18068930341870705_8434049462797539537_n.png": {replace: "skull", keep: "barbed wire"},
"477528558_18067213492870705_5202122066376182871_n.png": {replace: "person and guns", keep: "barbed wire and lightning"},
"476075948_18066024388870705_4787732589082743204_n.png": {replace: "globe", keep: "sword-like shape, electric energy, and skeletal form"},
  
};



