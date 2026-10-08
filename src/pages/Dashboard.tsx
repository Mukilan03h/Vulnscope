import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import type { Severity } from "@/lib/types";
import { Stat, SectionTitle, SeverityBadge, SEV_COLOR } from "@/components/ui";
import { SeverityDonut, BarList, Gauge } from "@/components/Charts";
import { vulnByKey } from "@/lib/vuln/catalog";

export default function Dashboard() {
  const findings = useStore((s) => s.findings);
  const targets = useStore((s) => s.targets);
  const scans = useStore((s) => s.scans);

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<Severity, number>;
  findings.forEach((f) => (bySeverity[f.severity] += 1));

  const open = findings.filter((f) => !["resolved", "false-positive", "duplicate"].includes(f.status)).length;

  const catCounts = new Map<string, number>();
  findings.forEach((f) => catCounts.set(f.category, (catCounts.get(f.category) ?? 0) + 1));
  const catItems = [...catCounts.entries()]
    .map(([key, value]) => ({ label: vulnByKey(key)?.name ?? key, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const latestScan = scans[0];
  const recent = [...findings].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security posture</h1>
        <p className="mt-1 text-sm text-muted">
          Findings across {targets.length} authorized target{targets.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open findings" value={open} sub={`${findings.length} total`} />
        <Stat label="Critical + High" value={bySeverity.critical + bySeverity.high} sub="needs attention" />
        <Stat label="Targets in scope" value={targets.filter((t) => t.authorized).length} sub="authorized" />
        <Stat
          label="LLM robustness"
          value={latestScan ? `${latestScan.robustness}` : "—"}
          sub={latestScan ? `${latestScan.model}` : "no scan yet"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <SectionTitle>Severity breakdown</SectionTitle>
          <SeverityDonut data={bySeverity} />
        </div>
        <div className="card lg:col-span-1">
          <SectionTitle>Top categories</SectionTitle>
          {catItems.length ? (
            <BarList items={catItems} />
          ) : (
            <p className="text-sm text-muted">No findings yet.</p>
          )}
        </div>
        <div className="card lg:col-span-1">
          <SectionTitle
            action={
              <Link to="/llm" className="text-xs text-brand hover:underline">
                Run scan →
              </Link>
            }
          >
            Latest LLM red-team
          </SectionTitle>
          {latestScan ? (
            <div className="flex items-center gap-4">
              <Gauge value={latestScan.robustness} />
              <div className="text-sm">
                <div className="font-medium">{latestScan.llmTargetLabel}</div>
                <div className="text-muted">{latestScan.model}</div>
                <div className="mt-2 text-muted">
                  {latestScan.results.filter((r) => r.passed).length}/{latestScan.results.length}{" "}
                  probes resisted
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              No LLM scans yet. Configure an authorized model endpoint and run the OWASP LLM
              Top-10 probe suite.
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <SectionTitle
          action={
            <Link to="/findings" className="text-xs text-brand hover:underline">
              View all →
            </Link>
          }
        >
          Recent findings
        </SectionTitle>
        {recent.length ? (
          <div className="divide-y divide-border">
            {recent.map((f) => (
              <Link
                key={f.id}
                to={`/findings/${f.id}`}
                className="flex items-center gap-3 py-2.5 hover:opacity-80"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: SEV_COLOR[f.severity] }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{f.title}</span>
                <SeverityBadge severity={f.severity} />
                <span className="hidden w-24 text-right text-xs capitalize text-muted sm:block">
                  {f.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No findings yet.</p>
        )}
      </div>
    </div>
  );
}
