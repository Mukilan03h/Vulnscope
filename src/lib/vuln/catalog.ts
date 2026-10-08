import type { Severity } from "@/lib/types";

export interface VulnClass {
  key: string;
  name: string;
  typicalSeverity: Severity;
  cwe?: string;
  summary: string;
  whatToLookFor: string;
  bountyNote: string; // current bug-bounty value context (2025/26)
}

/**
 * Current high-value bug-bounty vulnerability classes.
 * Sourced from 2025/26 HackerOne/Bugcrowd reporting and practitioner write-ups.
 * This is a knowledge catalog — VulnScope does NOT perform unauthorized scanning.
 */
export const VULN_CATALOG: VulnClass[] = [
  {
    key: "idor",
    name: "IDOR / Broken Object-Level Authorization",
    typicalSeverity: "high",
    cwe: "CWE-639",
    summary:
      "The app exposes a reference to an internal object (id, uuid, filename) and fails to verify the caller owns it.",
    whatToLookFor:
      "Swap identifiers in requests/responses (userId, orderId, documentId) and watch for data belonging to another account. Check numeric, UUID and encoded ids, and API endpoints behind the UI.",
    bountyNote:
      "Most consistently rewarded class in 2025/26 — low exploitation complexity, high impact. API-exposed IDORs regularly pay $2.5k–$10k+.",
  },
  {
    key: "ssrf",
    name: "Server-Side Request Forgery (SSRF)",
    typicalSeverity: "high",
    cwe: "CWE-918",
    summary:
      "The server can be coerced into making requests to attacker-chosen destinations, often reaching internal services or cloud metadata.",
    whatToLookFor:
      "URL/webhook/image-fetch/import features. Try internal ranges, cloud metadata endpoints (link-local), and redirect chains. Blind SSRF via out-of-band callbacks.",
    bountyNote:
      "Top payout tier, especially when it reaches cloud metadata or internal admin surfaces.",
  },
  {
    key: "business-logic",
    name: "Business Logic Flaw",
    typicalSeverity: "high",
    summary:
      "Abuse of intended functionality — race conditions, negative quantities, skipped steps, replay, price/coupon manipulation.",
    whatToLookFor:
      "Multi-step flows (checkout, transfer, invite). Reorder, repeat, or parallelize steps. Negative/overflow values. Concurrent requests (TOCTOU).",
    bountyNote:
      "High value because scanners miss it entirely; requires understanding the app's intent.",
  },
  {
    key: "privesc",
    name: "Privilege Escalation",
    typicalSeverity: "critical",
    cwe: "CWE-269",
    summary:
      "A low-privilege actor gains higher privileges — horizontal (another peer) or vertical (admin).",
    whatToLookFor:
      "Role parameters in requests, mass-assignment of role/isAdmin, admin-only endpoints reachable by normal users, JWT claim tampering.",
    bountyNote:
      "High-severity tier ($3k–$10k+), frequently chained from IDOR/access-control gaps.",
  },
  {
    key: "access-control",
    name: "Broken Access Control",
    typicalSeverity: "high",
    cwe: "CWE-284",
    summary:
      "Authorization checks are missing or incorrect for functions, endpoints, or fields.",
    whatToLookFor:
      "Forced browsing to privileged routes, method tampering (GET vs POST), missing function-level checks, exposed internal APIs.",
    bountyNote: "Perennial high-volume, high-impact category.",
  },
  {
    key: "xss",
    name: "Cross-Site Scripting (XSS)",
    typicalSeverity: "medium",
    cwe: "CWE-79",
    summary:
      "Untrusted input is reflected/stored and executed as script in a victim's browser.",
    whatToLookFor:
      "Reflected params, stored fields (names, comments), DOM sinks (innerHTML, eval), markdown/HTML renderers, SVG/file uploads.",
    bountyNote:
      "Highest report volume but often lower payout ($100–$500 low-sev); stored/privileged-context XSS pays more.",
  },
  {
    key: "sqli",
    name: "SQL / GraphQL Injection",
    typicalSeverity: "critical",
    cwe: "CWE-89",
    summary:
      "Untrusted input alters a database query, enabling data theft or auth bypass.",
    whatToLookFor:
      "Error-based, boolean/time-based blind, ORDER BY / LIMIT injection, GraphQL argument injection and introspection abuse.",
    bountyNote:
      "GraphQL SQLi and injection via API endpoints flagged as notable 2025 payers.",
  },
  {
    key: "info-disclosure",
    name: "Sensitive Information Disclosure",
    typicalSeverity: "medium",
    cwe: "CWE-200",
    summary:
      "Secrets, PII, tokens, or internal details leak via responses, errors, headers, repos, or caches.",
    whatToLookFor:
      ".git/.env exposure, verbose errors, API keys in JS bundles, over-broad API responses, misconfigured storage buckets.",
    bountyNote: "Average payout rising; severity depends on what leaks.",
  },
  {
    key: "auth",
    name: "Improper Authentication",
    typicalSeverity: "high",
    cwe: "CWE-287",
    summary:
      "Weaknesses in login, session, MFA, or token handling allow account takeover.",
    whatToLookFor:
      "OTP/MFA bypass, weak password reset, session fixation, JWT alg confusion, OAuth redirect/flow abuse.",
    bountyNote: "Account-takeover chains sit in the medium-to-high payout band.",
  },
  {
    key: "ai-prompt-injection",
    name: "AI / LLM Abuse (Prompt Injection, Model Abuse)",
    typicalSeverity: "high",
    summary:
      "LLM-backed features can be manipulated to bypass guardrails, exfiltrate data, or trigger unintended tool actions.",
    whatToLookFor:
      "Indirect injection via documents/pages the model reads, system-prompt leakage, excessive agency in tool-using agents. Use VulnScope's LLM Red-Team module.",
    bountyNote:
      "Fastest-growing rewarded category across platforms in 2025/26 as AI features ship.",
  },
];

export const vulnByKey = (key: string) =>
  VULN_CATALOG.find((v) => v.key === key);
