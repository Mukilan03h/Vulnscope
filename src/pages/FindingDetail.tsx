import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import type { FindingStatus, Severity } from "@/lib/types";
import { SeverityBadge, SectionTitle } from "@/components/ui";
import { vulnByKey } from "@/lib/vuln/catalog";
import {
  cvssScore,
  cvssVector,
  severityFromScore,
  DEFAULT_CVSS,
  CVSS_LABELS,
  type Cvss31,
} from "@/lib/vuln/cvss";
import { buildReport, download } from "@/lib/vuln/report";

const STATUSES: FindingStatus[] = [
  "new",
  "triaging",
  "confirmed",
  "reported",
  "accepted",
  "resolved",
  "duplicate",
  "false-positive",
];

function parseVector(v?: string): Cvss31 {
  if (!v) return DEFAULT_CVSS;
  const m = { ...DEFAULT_CVSS };
  v.replace("CVSS:3.1/", "")
    .split("/")
    .forEach((p) => {
      const [k, val] = p.split(":");
      if (k in m) (m as Record<string, string>)[k] = val;
    });
  return m;
}

export default function FindingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const finding = useStore((s) => s.findings.find((f) => f.id === id));
  const target = useStore((s) => s.targets.find((t) => t.id === finding?.targetId));
  const update = useStore((s) => s.updateFinding);
  const remove = useStore((s) => s.removeFinding);

  const [cvss, setCvss] = useState<Cvss31>(parseVector(finding?.cvssVector));

  const score = useMemo(() => cvssScore(cvss), [cvss]);
  const vector = useMemo(() => cvssVector(cvss), [cvss]);

  if (!finding) {
    return (
      <div className="card text-center">
        <p className="text-muted">Finding not found.</p>
        <Link to="/findings" className="text-brand hover:underline">
          Back to findings
        </Link>
      </div>
    );
  }
  const cls = vulnByKey(finding.category);

  const field = (k: keyof typeof finding, label: string, rows = 4, placeholder = "") => (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="input font-mono text-xs leading-relaxed"
        rows={rows}
        placeholder={placeholder}
        defaultValue={(finding[k] as string) ?? ""}
        onBlur={(e) => update(finding.id, { [k]: e.target.value })}
      />
    </div>
  );

  function applyCvss() {
    const sev = severityFromScore(score) as Severity;
    update(finding!.id, { cvss: score, cvssVector: vector, severity: sev });
  }

  function exportReport() {
    const latest = useStore.getState().findings.find((f) => f.id === finding!.id)!;
    const md = buildReport(latest, target);
    download(`${latest.id}-report.md`, md);
  }

  return (
    <div className="space-y-5">
      <Link to="/findings" className="text-sm text-muted hover:text-ink">
        ← Findings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <input
            className="w-full bg-transparent text-2xl font-semibold outline-none"
            defaultValue={finding.title}
            onBlur={(e) => update(finding.id, { title: e.target.value })}
          />
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <SeverityBadge severity={finding.severity} />
            {finding.cvss != null && <span>CVSS {finding.cvss}</span>}
            <span>· {cls?.name ?? finding.category}</span>
            {target && <span>· {target.name}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={exportReport}>
            Export HackerOne report
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              if (confirm("Delete this finding?")) {
                remove(finding.id);
                nav("/findings");
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="label mb-0">Status</label>
        <select
          className="input max-w-[200px]"
          defaultValue={finding.status}
          onChange={(e) => update(finding.id, { status: e.target.value as FindingStatus })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {cls && (
        <div className="card bg-surface2/50 text-sm">
          <SectionTitle>What to look for — {cls.name}</SectionTitle>
          <p className="text-muted">{cls.whatToLookFor}</p>
          <p className="mt-2 text-xs text-low">💰 {cls.bountyNote}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {field("description", "Summary", 3, "One or two sentences describing the issue.")}
        {field("impact", "Impact", 3, "Concrete security/business impact.")}
        {field("steps", "Steps to reproduce", 6, "1. …\n2. …\n3. Observe …")}
        {field("remediation", "Remediation", 6, "How the team should fix it.")}
      </div>

      <div className="card">
        <SectionTitle action={<button className="btn-primary" onClick={applyCvss}>Apply score</button>}>
          CVSS 3.1 calculator
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(CVSS_LABELS) as (keyof Cvss31)[]).map((k) => (
            <div key={k}>
              <label className="label">{CVSS_LABELS[k].label}</label>
              <select
                className="input"
                value={cvss[k]}
                onChange={(e) => setCvss({ ...cvss, [k]: e.target.value } as Cvss31)}
              >
                {CVSS_LABELS[k].opts.map(([val, lbl]) => (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="text-3xl font-semibold">{score.toFixed(1)}</div>
          <SeverityBadge severity={severityFromScore(score) as Severity} />
          <code className="rounded bg-surface2 px-2 py-1 text-xs text-muted">{vector}</code>
        </div>
      </div>
    </div>
  );
}
