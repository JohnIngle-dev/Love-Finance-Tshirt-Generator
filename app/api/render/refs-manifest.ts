// Exact, case-sensitive filenames from /public/refs go here.
// Key = the file name (including extension). Values = what to replace and what to keep.
//
// TIP: First deploy the /api/refs endpoint below and visit /api/refs in your browser
// to see the exact filenames. Then paste them here.

export type ManifestEntry = { replace: string; keep: string };

export const REFS_MANIFEST: Record<string, ManifestEntry> = {
  // EXAMPLES — replace these with your real files:
"536000820_18084508084870705_1863751485079456271_n.png": {replace: "metal engine behind skull", keep: "skull and fire"},
"532324876_18083609578870705_7786025600770441868_n.png": {replace: "skull", keep: "purple and red cobra snake, make sure snake head is visbale and mouth wide open with fangs"},
"520941856_18082385257870705_3068542842883755053_n.png": {replace: "cards and chips", keep: "chrome revolver silhouette and orange glow"},
"491416516_18073621093870705_1553309421817675182_n.png": {replace: "skulls on floor", keep: "hooded figure and crossed emblem"},
"491415021_18072545323870705_8507131698627680283_n.png": {replace: "blue car", keep: "city background and border chains"},
"490757356_18072793927870705_5264794875672410706_n.png": {replace: "golden dragon", keep: "samurai and energy blade motif"},
"483086357_18068930341870705_8434049462797539537_n.png": {replace: "skull", keep: "barbed wire"},
"477528558_18067213492870705_5202122066376182871_n.png": {replace: "person and guns", keep: "barbed wire and lightning"},
"469429856_3563671997263887_6273377183839423273_n.png": {replace: "globe", keep: "green dragon"},
"464219090_859263849729134_4970671754337849920_n.png": {replace: "flag", keep: "people"},
"339157317_579786897547977_2609644628084502931_n.png": {replace: "skull", keep: "green cobra snake, lighning and money"},
"294249437_119614124127622_7952573169032721357_n.png": {replace: "crab", keep: "skull and corbra snake, make sure snake head is visbale and mouth wide open with fangs"},
"452993072_1024825052182718_8869521735497110356_n.png": {replace: "person", keep: "blue lighnitng"},
"447978241_1462976974607361_4526319763357150234_n.png": {replace: "spikes and chain", keep: "skull"},
"466365079_920085766701610_882648000067426479_n.png": {replace: "red mushrooms", keep: "skull"},
  
};



