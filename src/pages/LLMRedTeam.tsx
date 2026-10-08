import { useState } from "react";
import { useStore, uid } from "@/lib/store";
import type { LlmTarget, ProbeResult, ScanRun, Finding } from "@/lib/types";
import { PROBES, OWASP_LLM } from "@/lib/llm/probes";
import { runScan } from "@/lib/llm/runner";
import { Gauge } from "@/components/Charts";
import { Pill, SectionTitle } from "@/components/ui";

const emptyTarget: LlmTarget = {
  id: "",
  label: "",
  provider: "openai-compatible",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  apiKey: "",
  authorized: false,
};

export default function LLMRedTeam() {
  const scans = useStore((s) => s.scans);
  const addScan = useStore((s) => s.addScan);
  const addFinding = useStore((s) => s.addFinding);

  const [t, setT] = useState<LlmTarget>(emptyTarget);
  const [selected, setSelected] = useState<string[]>(PROBES.map((p) => p.id));
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [live, setLive] = useState<ProbeResult[]>([]);
  const [result, setResult] = useState<ScanRun | null>(scans[0] ?? null);
  const [error, setError] = useState<string | null>(null);

  const canRun = t.label && t.baseUrl && t.model && t.authorized && selected.length > 0 && !running;

  async function run() {
    setError(null);
    setRunning(true);
    setLive([]);
    setResult(null);
    setProgress({ done: 0, total: selected.length });
    try {
      const scan = await runScan(
        { ...t, id: uid() },
        {
          probeIds: selected,
          onProgress: (done, total, last) => {
            setProgress({ done, total });
            if (last) setLive((prev) => [...prev, last]);
          },
        }
      );
      setResult(scan);
      addScan(scan);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  function saveAsFinding(r: ProbeResult) {
    const probe = PROBES.find((p) => p.id === r.probeId)!;
    const now = new Date().toISOString();
    const f: Finding = {
      id: uid(),
      title: `${probe.title} — ${t.label}`,
      category: "ai-prompt-injection",
      severity: probe.owasp === "LLM07" || probe.owasp === "LLM02" ? "high" : "medium",
      status: "confirmed",
      description: `${OWASP_LLM[probe.owasp]} (${probe.owasp}). ${probe.description}`,
      steps: `Probe: ${probe.id}\nPrompt sent:\n${r.prompt}\n\nModel response:\n${r.response}`,
      impact: r.rationale,
      remediation:
        "Harden the system prompt, add input/output filtering and instruction-hierarchy defenses, and re-test with VulnScope on each release.",
      references: [`OWASP ${probe.owasp}:2025 ${OWASP_LLM[probe.owasp]}`],
      source: "llm-redteam",
      createdAt: now,
      updatedAt: now,
    };
    addFinding(f);
    alert("Saved to Findings.");
  }

  const shown = result?.results ?? live;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">LLM Red-Team</h1>
        <p className="mt-1 text-sm text-muted">
          garak-style guardrail &amp; prompt-injection testing mapped to the OWASP LLM Top 10 (2025).
          Benign canary-based probes — point it only at models you&apos;re authorized to test.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-3">
          <SectionTitle>Target model</SectionTitle>
          <div>
            <label className="label">Label</label>
            <input
              className="input"
              placeholder="Internal support bot (staging)"
              value={t.label}
              onChange={(e) => setT({ ...t, label: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Provider</label>
              <select
                className="input"
                value={t.provider}
                onChange={(e) => setT({ ...t, provider: e.target.value as LlmTarget["provider"] })}
              >
                <option value="openai-compatible">OpenAI-compatible</option>
                <option value="anthropic">Anthropic</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="label">Model</label>
              <input
                className="input"
                value={t.model}
                onChange={(e) => setT({ ...t, model: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Base URL</label>
            <input
              className="input"
              value={t.baseUrl}
              onChange={(e) => setT({ ...t, baseUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="label">API key (kept in memory only)</label>
            <input
              className="input"
              type="password"
              placeholder="sk-…"
              value={t.apiKey}
              onChange={(e) => setT({ ...t, apiKey: e.target.value })}
            />
          </div>
          <label className="flex items-start gap-2 rounded-lg border border-high/30 bg-high/5 p-3 text-sm text-high">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand"
              checked={t.authorized}
              onChange={(e) => setT({ ...t, authorized: e.target.checked })}
            />
            I own this model/endpoint or am explicitly authorized to security-test it.
          </label>
          <button className="btn-primary w-full" disabled={!canRun} onClick={run}>
            {running ? `Running… ${progress.done}/${progress.total}` : "Run probe suite"}
          </button>
          {error && <p className="text-sm text-crit">Error: {error}</p>}
        </div>

        <div className="card">
          <SectionTitle>Probe suite ({selected.length}/{PROBES.length})</SectionTitle>
          <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
            {PROBES.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-surface2/50 p-2.5 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand"
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    setSelected((s) =>
                      e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id)
                    )
                  }
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Pill>{p.owasp}</Pill>
                    <span className="font-medium">{p.title}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">{p.category}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {(shown.length > 0 || result) && (
        <div className="card">
          <SectionTitle>Results</SectionTitle>
          <div className="flex flex-wrap items-center gap-6">
            {result && <Gauge value={result.robustness} />}
            <div className="text-sm">
              <div className="text-muted">Robustness score</div>
              <div className="text-xs text-muted">
                {shown.filter((r) => r.passed).length}/{shown.length} probes resisted
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {shown.map((r) => {
              const probe = PROBES.find((p) => p.id === r.probeId);
              return (
                <details
                  key={r.probeId}
                  className={`rounded-lg border p-3 ${
                    r.passed ? "border-low/30 bg-low/5" : "border-crit/40 bg-crit/5"
                  }`}
                >
                  <summary className="flex cursor-pointer items-center gap-2 text-sm">
                    <Pill tone={r.passed ? "good" : "bad"}>{r.passed ? "RESISTED" : "VULNERABLE"}</Pill>
                    {probe && <Pill>{probe.owasp}</Pill>}
                    <span className="font-medium">{probe?.title ?? r.probeId}</span>
                    <span className="ml-auto text-xs text-muted">{r.category}</span>
                  </summary>
                  <div className="mt-3 space-y-2 text-xs">
                    <p className="text-muted">{r.rationale}</p>
                    <div>
                      <div className="label">Prompt</div>
                      <pre className="whitespace-pre-wrap rounded bg-bg p-2 font-mono text-[11px] text-ink/80">
                        {r.prompt}
                      </pre>
                    </div>
                    <div>
                      <div className="label">Response</div>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-bg p-2 font-mono text-[11px] text-ink/80">
                        {r.response}
                      </pre>
                    </div>
                    {!r.passed && (
                      <button className="btn-ghost text-xs" onClick={() => saveAsFinding(r)}>
                        + Save as finding
                      </button>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
