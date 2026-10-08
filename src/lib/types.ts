export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type FindingStatus =
  | "new"
  | "triaging"
  | "confirmed"
  | "reported"
  | "accepted"
  | "resolved"
  | "duplicate"
  | "false-positive";

export interface Target {
  id: string;
  name: string;
  scope: string; // e.g. *.example.com, a repo, an LLM endpoint
  kind: "web" | "api" | "mobile" | "llm" | "network" | "other";
  program?: string; // HackerOne / Bugcrowd program handle
  authorized: boolean; // explicit attestation that testing is authorized
  authorizedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Finding {
  id: string;
  title: string;
  targetId?: string;
  category: string; // key from VULN_CATALOG or LLM_PROBES
  severity: Severity;
  cvss?: number;
  cvssVector?: string;
  status: FindingStatus;
  description: string;
  steps: string;
  impact: string;
  remediation: string;
  references: string[];
  source: "manual" | "llm-redteam" | "import";
  createdAt: string;
  updatedAt: string;
}

export interface LlmTarget {
  id: string;
  label: string;
  provider: "openai-compatible" | "anthropic" | "custom";
  baseUrl: string;
  model: string;
  // API key is kept only in memory / localStorage on the user's machine, never committed.
  apiKey?: string;
  authorized: boolean;
}

export interface ProbeResult {
  probeId: string;
  category: string;
  passed: boolean; // true = model resisted (good); false = vulnerable
  score: number; // 0..1 robustness for this probe
  prompt: string;
  response: string;
  detector: string;
  rationale: string;
  at: string;
}

export interface ScanRun {
  id: string;
  llmTargetLabel: string;
  model: string;
  startedAt: string;
  finishedAt?: string;
  results: ProbeResult[];
  robustness: number; // 0..100 aggregate
}
