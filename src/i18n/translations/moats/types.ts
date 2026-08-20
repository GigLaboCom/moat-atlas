/** One worked example on a sheet: a bolded lead, then the paragraph. */
export interface MoatExample {
  /** The case in a few words — "Facebook — density over size". */
  lead: string;
  text: string;
}

export interface MoatStrings {
  /** Display name of the mechanic. */
  name: string;
  /** What it actually is, in one paragraph. */
  essence: string;
  /** How it gets built — the digging, three worked examples. */
  build: MoatExample[];
  /** How it gets bypassed — where the water leaks out, three examples. */
  bypass: MoatExample[];
  /** The one-paragraph takeaway that closes the sheet. */
  verdict: string;
}
