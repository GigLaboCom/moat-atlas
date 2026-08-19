import type { MoatStrings } from "./types";

/**
 * Sheet copy per moat. `essence`, `build` and `bypass` are intentionally empty
 * in the skeleton — the sheet renders a "draft" notice until they are filled in
 * from the catalogue.
 */
const moats: Record<number, MoatStrings> = {
  1:  { name: "Network effects",        essence: "", build: "", bypass: "" },
  2:  { name: "Marketplace liquidity",  essence: "", build: "", bypass: "" },
  3:  { name: "Proprietary data",       essence: "", build: "", bypass: "" },
  4:  { name: "Proprietary models",     essence: "", build: "", bypass: "" },
  5:  { name: "Switching costs",        essence: "", build: "", bypass: "" },
  6:  { name: "Integrations",           essence: "", build: "", bypass: "" },
  7:  { name: "Compliance",             essence: "", build: "", bypass: "" },
  8:  { name: "Brand and trust",        essence: "", build: "", bypass: "" },
  9:  { name: "Infrastructure scale",   essence: "", build: "", bypass: "" },
  10: { name: "Hardware",               essence: "", build: "", bypass: "" },
  11: { name: "Collaboration",          essence: "", build: "", bypass: "" },
  12: { name: "Content and rights",     essence: "", build: "", bypass: "" },
  13: { name: "Execution polish",       essence: "", build: "", bypass: "" },
  14: { name: "Patents and IP",         essence: "", build: "", bypass: "" },
  15: { name: "Economies of scale",     essence: "", build: "", bypass: "" },
  16: { name: "Distribution and defaults", essence: "", build: "", bypass: "" },
  17: { name: "Counter-positioning",    essence: "", build: "", bypass: "" },
  18: { name: "Cornered resource",      essence: "", build: "", bypass: "" },
  19: { name: "Process power",          essence: "", build: "", bypass: "" },
  20: { name: "Developer ecosystem",    essence: "", build: "", bypass: "" },
  21: { name: "Community",              essence: "", build: "", bypass: "" },
  22: { name: "Capital as a moat",      essence: "", build: "", bypass: "" },
  23: { name: "Speed",                  essence: "", build: "", bypass: "" },
  24: { name: "Efficient scale",        essence: "", build: "", bypass: "" },
  25: { name: "Habit",                  essence: "", build: "", bypass: "" },
  26: { name: "Installed base",         essence: "", build: "", bypass: "" },
  27: { name: "Bundling and reach",     essence: "", build: "", bypass: "" },
  28: { name: "Vertical integration",   essence: "", build: "", bypass: "" },
  29: { name: "Standard and format",    essence: "", build: "", bypass: "" },
  30: { name: "Regulatory capture",     essence: "", build: "", bypass: "" },
  31: { name: "Physical presence",      essence: "", build: "", bypass: "" },
  32: { name: "Owned audience",         essence: "", build: "", bypass: "" },
  33: { name: "Category leadership",    essence: "", build: "", bypass: "" },
  34: { name: "Locked-in reputation",   essence: "", build: "", bypass: "" },
  35: { name: "Experience curve",       essence: "", build: "", bypass: "" },
};

export default moats;
