import type { Finding, Target } from "@/lib/types";

/**
 * Generate a bug-bounty submission report in Markdown, structured the way
 * HackerOne / Bugcrowd triage teams expect. Paste directly into a report.
 */
export function buildReport(f: Finding, target?: Target): string {
  const sevLine = f.cvss
    ? `**${f.severity.toUpperCase()}** — CVSS ${f.cvss} \`${f.cvssVector ?? ""}\``
    : `**${f.severity.toUpperCase()}**`;

  const refs =
    f.references.length > 0
      ? f.references.map((r) => `- ${r}`).join("\n")
      : "- _(add CWE/OWASP references)_";

  return `# ${f.title}

## Summary
${f.description.trim() || "_Describe the vulnerability in one or two sentences._"}

## Severity
${sevLine}
Category: \`${f.category}\`

## Asset / Scope
${target ? `- Target: **${target.name}** (\`${target.scope}\`)${target.program ? `\n- Program: ${target.program}` : ""}` : "- _Specify the in-scope asset you tested._"}

## Steps to Reproduce
${f.steps.trim() || "1. _Step one_\n2. _Step two_\n3. _Observe the issue_"}

## Impact
${f.impact.trim() || "_Explain the concrete business/security impact to the program._"}

## Remediation
${f.remediation.trim() || "_Recommend a fix._"}

## References
${refs}

---
> Submitted via VulnScope. Testing performed only against authorized, in-scope assets under the program's policy.
`;
}

export function download(filename: string, content: string, type = "text/markdown") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
