# VulnScope

**An easy-to-use dashboard for authorized vulnerability assessment, bug-bounty
finding management, and LLM red-teaming.**

VulnScope is built to make identifying and reporting vulnerabilities *fast and
approachable* — a defensive companion for security teams, pentesters, and
bug-bounty hunters working on assets they own or are **authorized** to test.

It is not an attack toolkit. It won't scan or exploit systems you don't control.
Instead it helps you organize scope, triage and score findings, generate
submission-ready reports, and red-team your own LLM features.

---

## Features

### 🛡 Findings & bug-bounty workflow
- Central findings list with severity, status, and search/filter.
- Built-in knowledge catalog of the **highest-value 2025/26 bug-bounty classes**
  (IDOR, SSRF, business-logic, privilege escalation, broken access control, XSS,
  SQL/GraphQL injection, info disclosure, auth, AI/LLM abuse) — each with
  "what to look for" guidance and current payout context.
- **CVSS 3.1 calculator** with live score + vector, auto-mapped to severity.
- **One-click HackerOne / Bugcrowd report export** (Markdown) with the exact
  sections triage teams expect: summary, severity, scope, steps, impact,
  remediation, references.

### ⬡ LLM Red-Team (garak-style)
- Probe suite mapped to the **OWASP LLM Top 10 (2025)**: prompt injection
  (direct + indirect), system-prompt leakage, sensitive-information disclosure,
  guardrail-bypass / refusal-consistency, excessive agency, misinformation.
- Benign, **canary-based** diagnostic probes — they test whether guardrails and
  the instruction hierarchy hold, without shipping weaponized payloads.
- Point it at any OpenAI-compatible or Anthropic endpoint (your own key, kept in
  memory only), run the suite, and get a **robustness score (0–100)** plus a
  per-probe `RESISTED` / `VULNERABLE` verdict with full prompt/response.
- Save any vulnerable probe directly as a tracked finding.

### ▦ Dashboard
- Severity breakdown, top categories, latest LLM robustness, recent activity.

### ◎ Targets & scope
- Every target carries an explicit **authorization attestation**. LLM scans and
  target management are gated on it — scope discipline is built into the UX.

---

## Tech stack
React 18 · TypeScript · Vite · Tailwind CSS · Zustand (localStorage-persisted).
No backend — everything runs in the browser. API keys are never persisted to
disk or sent anywhere except the model endpoint you configure.

## Getting started
```bash
bun install      # or: npm install
bun run dev      # start the dev server (http://localhost:5173)
bun run build    # typecheck + production build
```

## Responsible use
VulnScope is for **authorized** security testing only — assets you own or have
explicit written permission (e.g. a bug-bounty program's policy) to test. You
are responsible for staying within scope, rate limits, and the law. The LLM
red-team module is intended to help you *harden your own AI features*.

## Roadmap ideas
- Scanner import (Nmap / Nuclei / OpenVAS / ZAP) → findings.
- PDF report export and per-engagement report bundles.
- Custom LLM probe packs and regression tracking across model versions.
- Team mode with a shared backend.

---
_Built as a focused, defensive alternative in the vulnerability-management space._
