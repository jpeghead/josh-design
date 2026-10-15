export type Source = "greenhouse" | "ashby" | "lever" | "workable" | "rippling" | "hn";

export type Company = { name: string; source: Exclude<Source, "hn">; slug: string; note?: string; /** On Today: anything new from this company is called out. */ watch?: boolean };

export type Posting = {
  id: string;
  source: Source;
  company: string;
  title: string;
  location: string;
  remote: boolean;
  url: string;
  applyUrl: string;
  description: string;
  postedAt: string | null;
  firstSeen: string;
  lastSeen: string;
  tier: "core" | "stretch" | "other";
  score: number;
  scoreWhy: string;
  scoredBy: "rules" | "claude";
  /** AI words in the title and description; 3 or more means AI is the job. */
  ai?: number;
  /** Published pay range, as the board states it ("$170K – $295K"), or found in the text. */
  pay?: string;
  persona: "designer-who-builds" | "ai-builder";
  status: "new" | "saved" | "hidden" | "applied";
  notes?: string;
};

export type ScanRun = { at: string; fetched: number; kept: number; added: number; errors: string[] };
