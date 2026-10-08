import type { Severity } from "@/lib/types";

// Minimal CVSS 3.1 Base Score calculator.
export interface Cvss31 {
  AV: "N" | "A" | "L" | "P"; // Attack Vector
  AC: "L" | "H"; // Attack Complexity
  PR: "N" | "L" | "H"; // Privileges Required
  UI: "N" | "R"; // User Interaction
  S: "U" | "C"; // Scope
  C: "N" | "L" | "H"; // Confidentiality
  I: "N" | "L" | "H"; // Integrity
  A: "N" | "L" | "H"; // Availability
}

export const DEFAULT_CVSS: Cvss31 = {
  AV: "N",
  AC: "L",
  PR: "N",
  UI: "N",
  S: "U",
  C: "H",
  I: "N",
  A: "N",
};

const AV = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC = { L: 0.77, H: 0.44 };
const UI = { N: 0.85, R: 0.62 };
const PR_U = { N: 0.85, L: 0.62, H: 0.27 };
const PR_C = { N: 0.85, L: 0.68, H: 0.5 };
const CIA = { N: 0, L: 0.22, H: 0.56 };

const roundUp = (n: number) => Math.ceil(n * 10) / 10;

export function cvssScore(m: Cvss31): number {
  const iss = 1 - (1 - CIA[m.C]) * (1 - CIA[m.I]) * (1 - CIA[m.A]);
  const impact =
    m.S === "U"
      ? 6.42 * iss
      : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  const pr = m.S === "C" ? PR_C[m.PR] : PR_U[m.PR];
  const exploitability = 8.22 * AV[m.AV] * AC[m.AC] * pr * UI[m.UI];
  if (impact <= 0) return 0;
  const base =
    m.S === "U"
      ? Math.min(impact + exploitability, 10)
      : Math.min(1.08 * (impact + exploitability), 10);
  return roundUp(base);
}

export function cvssVector(m: Cvss31): string {
  return `CVSS:3.1/AV:${m.AV}/AC:${m.AC}/PR:${m.PR}/UI:${m.UI}/S:${m.S}/C:${m.C}/I:${m.I}/A:${m.A}`;
}

export function severityFromScore(score: number): Severity {
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "medium";
  if (score > 0) return "low";
  return "info";
}

export const CVSS_LABELS: Record<keyof Cvss31, { label: string; opts: [string, string][] }> = {
  AV: { label: "Attack Vector", opts: [["N", "Network"], ["A", "Adjacent"], ["L", "Local"], ["P", "Physical"]] },
  AC: { label: "Attack Complexity", opts: [["L", "Low"], ["H", "High"]] },
  PR: { label: "Privileges Required", opts: [["N", "None"], ["L", "Low"], ["H", "High"]] },
  UI: { label: "User Interaction", opts: [["N", "None"], ["R", "Required"]] },
  S: { label: "Scope", opts: [["U", "Unchanged"], ["C", "Changed"]] },
  C: { label: "Confidentiality", opts: [["N", "None"], ["L", "Low"], ["H", "High"]] },
  I: { label: "Integrity", opts: [["N", "None"], ["L", "Low"], ["H", "High"]] },
  A: { label: "Availability", opts: [["N", "None"], ["L", "Low"], ["H", "High"]] },
};
