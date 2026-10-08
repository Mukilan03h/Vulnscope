import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore, uid } from "@/lib/store";
import type { Finding, Severity } from "@/lib/types";
import { SeverityBadge } from "@/components/ui";
import { VULN_CATALOG, vulnByKey } from "@/lib/vuln/catalog";

const SEVS: Severity[] = ["critical", "high", "medium", "low", "info"];

export default function Findings() {
  const findings = useStore((s) => s.findings);
  const targets = useStore((s) => s.targets);
  const addFinding = useStore((s) => s.addFinding);
  const [q, setQ] = useState("");
  const [sev, setSev] = useState<Severity | "all">("all");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    return findings
      .filter((f) => (sev === "all" ? true : f.severity === sev))
      .filter((f) => (q ? f.title.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [findings, q, sev]);

  function createFinding(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const category = String(form.get("category"));
    const cls = vulnByKey(category);
    const now = new Date().toISOString();
    const f: Finding = {
      id: uid(),
      title: String(form.get("title")) || "Untitled finding",
      targetId: String(form.get("targetId")) || undefined,
      category,
      severity: (cls?.typicalSeverity ?? "medium") as Severity,
      status: "new",
      description: "",
      steps: "",
      impact: "",
      remediation: cls?.whatToLookFor ? "" : "",
      references: cls?.cwe ? [cls.cwe] : [],
      source: "manual",
      createdAt: now,
      updatedAt: now,
    };
    addFinding(f);
    setShowNew(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Findings</h1>
          <p className="mt-1 text-sm text-muted">{filtered.length} shown</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew((v) => !v)}>
          + New finding
        </button>
      </div>

      {showNew && (
        <form onSubmit={createFinding} className="card grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input name="title" className="input" placeholder="e.g. IDOR on /api/orders/{id}" required />
          </div>
          <div>
            <label className="label">Vulnerability class</label>
            <select name="category" className="input" defaultValue="idor">
              {VULN_CATALOG.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Target</label>
            <select name="targetId" className="input" defaultValue="">
              <option value="">— none —</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="btn-primary">
              Create
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search findings…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-1">
          <button
            className={`btn-ghost ${sev === "all" ? "border-brand/60 text-ink" : ""}`}
            onClick={() => setSev("all")}
          >
            All
          </button>
          {SEVS.map((s) => (
            <button
              key={s}
              className={`btn-ghost capitalize ${sev === s ? "border-brand/60 text-ink" : ""}`}
              onClick={() => setSev(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card divide-y divide-border p-0">
        {filtered.map((f) => (
          <Link
            key={f.id}
            to={`/findings/${f.id}`}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface2"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{f.title}</div>
              <div className="mt-0.5 text-xs text-muted">
                {vulnByKey(f.category)?.name ?? f.category}
                {f.cvss ? ` · CVSS ${f.cvss}` : ""}
              </div>
            </div>
            <SeverityBadge severity={f.severity} />
            <span className="hidden w-24 text-right text-xs capitalize text-muted sm:block">
              {f.status}
            </span>
          </Link>
        ))}
        {!filtered.length && <div className="px-5 py-10 text-center text-sm text-muted">No findings match.</div>}
      </div>
    </div>
  );
}
