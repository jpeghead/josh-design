export type Source = "greenhouse" | "ashby" | "lever" | "hn";

export type Company = { name: string; source: Exclude<Source, "hn">; slug: string; note?: string };

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
  persona: "designer-who-builds" | "ai-builder";
  status: "new" | "saved" | "hidden" | "applied";
  notes?: string;
};

export type ScanRun = { at: string; fetched: number; kept: number; added: number; errors: string[] };
