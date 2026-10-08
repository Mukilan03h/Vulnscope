import { useState } from "react";
import type { LlmTarget } from "@/lib/types";
import { uid } from "@/lib/store";
import { TRANSFORMS } from "@/lib/llm/transforms";
import { BENIGN_BEHAVIORS, importBehaviors, type Behavior } from "@/lib/llm/behaviors";
import { runMatrix, type MatrixReport, type AttackCell } from "@/lib/llm/matrix";
import { Pill, SectionTitle } from "@/components/ui";
import { download } from "@/lib/vuln/report";

const emptyTarget: LlmTarget = {
  id: "",
  label: "",
  provider: "openai-compatible",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  apiKey: "",
  authorized: false,
};

function asrColor(v: number): string {
  // 0% broke = secure (teal) … 100% broke = critical (red). Colorblind-aware ramp.
  if (v === 0) return "#4fd1c5";
  if (v < 34) return "#ffd23f";
  if (v < 67) return "#ff8a3d";
  return "#ff4d6d";
}

export default function AttackLab() {
  const [t, setT] = useState<LlmTarget>(emptyTarget);
  const [useJudge, setUseJudge] = useState(false);
  const [judge, setJudge] = useState<LlmTarget>({ ...emptyTarget, label: "judge" });
  const [source, setSource] = useState<"benign" | "import">("benign");
  const [imported, setImported] = useState<Behavior[]>([]);
  const [importText, setImportText] = useState("");
  const [transformIds, setTransformIds] = useState<string[]>(TRANSFORMS.map((x) => x.id));
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [report, setReport] = useState<MatrixReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspect, setInspect] = useState<AttackCell | null>(null);

  const behaviors = source === "benign" ? BENIGN_BEHAVIORS : imported;
  const canRun =
    t.label && t.baseUrl && t.model && t.authorized && behaviors.length > 0 && transformIds.length > 0 && !running;

  function doImport() {
    const rows = importBehaviors(importText);
    setImported(rows);
    setSource("import");
  }

  async function run() {
    setError(null);
    setReport(null);
    setRunning(true);
    setProgress({ done: 0, total: behaviors.length * transformIds.length });
    try {
      const rep = await runMatrix(
        { ...t, id: uid() },
        {
          behaviors,
          transformIds,
          judgeTarget: useJudge ? { ...judge, id: uid() } : undefined,
          onProgress: (done, total) => setProgress({ done, total }),
        }
      );
      setReport(rep);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  function exportJson() {
    if (!report) return;
    download(`attack-matrix-${report.id.slice(0, 8)}.json`, JSON.stringify(report, null, 2), "application/json");
  }

  const activeTransforms = TRANSFORMS.filter((x) => transformIds.includes(x.id));
  const cellOf = (bId: string, tId: string) =>
    report?.cells.find((c) => c.behaviorId === bId && c.transformId === tId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Attack Lab</h1>
        <p className="mt-1 text-sm text-muted">
          Run a technique × behavior attack matrix (garak/PyRIT-style) against a model you own or
          are authorized to test. Measures attack success rate (ASR) per technique so you know
          which bypasses your guardrails are weak to.
        </p>
      </div>

      <div className="card border-high/30 bg-high/5 text-sm text-high">
        ⚠ Isolated, authorized use only. Ships with a <strong>benign proxy</strong> behavior set.
        To test against standardized harmful-behavior datasets (e.g. HarmBench/AdvBench), import
        your own under your own authorization — VulnScope does not bundle them.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Target */}
        <div className="card space-y-3">
          <SectionTitle>Target model</SectionTitle>
          <input
            className="input"
            placeholder="Label (e.g. my-bot-staging)"
            value={t.label}
            onChange={(e) => setT({ ...t, label: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="input"
              value={t.provider}
              onChange={(e) => setT({ ...t, provider: e.target.value as LlmTarget["provider"] })}
            >
              <option value="openai-compatible">OpenAI-compatible</option>
              <option value="anthropic">Anthropic</option>
              <option value="custom">Custom</option>
            </select>
            <input className="input" value={t.model} onChange={(e) => setT({ ...t, model: e.target.value })} />
          </div>
          <input className="input" value={t.baseUrl} onChange={(e) => setT({ ...t, baseUrl: e.target.value })} />
          <input
            className="input"
            type="password"
            placeholder="API key (memory only)"
            value={t.apiKey}
            onChange={(e) => setT({ ...t, apiKey: e.target.value })}
          />
          <label className="flex items-start gap-2 rounded-lg border border-high/30 bg-high/5 p-2.5 text-sm text-high">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand"
              checked={t.authorized}
              onChange={(e) => setT({ ...t, authorized: e.target.checked })}
            />
            I own this endpoint or am authorized to security-test it, in an isolated environment.
          </label>
        </div>

        {/* Behaviors + judge */}
        <div className="card space-y-3">
          <SectionTitle>Behaviors ({behaviors.length})</SectionTitle>
          <div className="flex gap-2">
            <button
              className={`btn-ghost text-xs ${source === "benign" ? "border-brand/60 text-ink" : ""}`}
              onClick={() => setSource("benign")}
            >
              Benign proxy set ({BENIGN_BEHAVIORS.length})
            </button>
            <button
              className={`btn-ghost text-xs ${source === "import" ? "border-brand/60 text-ink" : ""}`}
              onClick={() => setSource("import")}
            >
              Imported ({imported.length})
            </button>
          </div>
          {source === "import" && (
            <div className="space-y-2">
              <textarea
                className="input font-mono text-xs"
                rows={4}
                placeholder={`Paste JSON [{"goal":"…","judge":"non-refusal"}] or one goal per line`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <button className="btn-ghost text-xs" onClick={doImport}>
                Load dataset
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand"
              checked={useJudge}
              onChange={(e) => setUseJudge(e.target.checked)}
            />
            Use an LLM judge for non-marker behaviors
          </label>
          {useJudge && (
            <div className="grid gap-2 rounded-lg border border-border bg-surface2/50 p-2.5">
              <input
                className="input text-xs"
                placeholder="Judge base URL"
                value={judge.baseUrl}
                onChange={(e) => setJudge({ ...judge, baseUrl: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input text-xs"
                  placeholder="Judge model"
                  value={judge.model}
                  onChange={(e) => setJudge({ ...judge, model: e.target.value })}
                />
                <input
                  className="input text-xs"
                  type="password"
                  placeholder="Judge API key"
                  value={judge.apiKey}
                  onChange={(e) => setJudge({ ...judge, apiKey: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transforms */}
      <div className="card">
        <SectionTitle
          action={
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" onClick={() => setTransformIds(TRANSFORMS.map((x) => x.id))}>
                All
              </button>
              <button className="btn-ghost text-xs" onClick={() => setTransformIds([])}>
                None
              </button>
            </div>
          }
        >
          Attack techniques ({transformIds.length}/{TRANSFORMS.length})
        </SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TRANSFORMS.map((x) => (
            <label
              key={x.id}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-surface2/50 p-2.5 text-xs"
              title={x.technique}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-brand"
                checked={transformIds.includes(x.id)}
                onChange={(e) =>
                  setTransformIds((s) => (e.target.checked ? [...s, x.id] : s.filter((y) => y !== x.id)))
                }
              />
              <span>
                <span className="font-medium text-ink">{x.name}</span>
                <span className="ml-1 text-muted">· {x.owasp}</span>
                {x.multiTurn && <Pill>multi-turn</Pill>}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={!canRun} onClick={run}>
          {running
            ? `Running ${progress.done}/${progress.total}…`
            : `Run matrix (${behaviors.length * transformIds.length} attacks)`}
        </button>
        {report && (
          <button className="btn-ghost" onClick={exportJson}>
            Export JSON
          </button>
        )}
        {error && <span className="text-sm text-crit">Error: {error}</span>}
      </div>

      {/* Heatmap */}
      {report && (
        <div className="card overflow-x-auto">
          <SectionTitle>
            Attack success heatmap — overall ASR {report.overallAsr}%
          </SectionTitle>
          <p className="mb-3 text-xs text-muted">
            Each cell = did the technique (column) break the guardrail for that behavior (row)?
            Red = bypassed, teal = resisted. Lower is safer. Click a cell to inspect.
          </p>
          <table className="w-full border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-surface text-left font-medium text-muted">Behavior \ Technique</th>
                {activeTransforms.map((tr) => (
                  <th key={tr.id} className="min-w-[2.2rem] rotate-0 text-muted" title={tr.name}>
                    <div className="truncate" style={{ maxWidth: 70 }}>
                      {tr.name.split(" ")[0]}
                    </div>
                  </th>
                ))}
                <th className="text-muted">ASR</th>
              </tr>
            </thead>
            <tbody>
              {behaviors.map((b) => (
                <tr key={b.id}>
                  <td className="sticky left-0 max-w-[12rem] truncate bg-surface pr-2 text-ink" title={b.label}>
                    {b.label}
                  </td>
                  {activeTransforms.map((tr) => {
                    const c = cellOf(b.id, tr.id);
                    const broke = c?.judgment.broke;
                    return (
                      <td key={tr.id}>
                        <button
                          onClick={() => c && setInspect(c)}
                          className="h-7 w-full rounded"
                          style={{ background: broke ? "#ff4d6d" : "#4fd1c5", opacity: c ? 1 : 0.2 }}
                          title={c ? (broke ? "BYPASSED" : "resisted") : ""}
                        />
                      </td>
                    );
                  })}
                  <td
                    className="text-center font-semibold"
                    style={{ color: asrColor(report.asrByBehavior[b.id] ?? 0) }}
                  >
                    {report.asrByBehavior[b.id] ?? 0}%
                  </td>
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 bg-surface pr-2 font-semibold text-muted">ASR by technique</td>
                {activeTransforms.map((tr) => (
                  <td
                    key={tr.id}
                    className="text-center font-semibold"
                    style={{ color: asrColor(report.asrByTransform[tr.id] ?? 0) }}
                  >
                    {report.asrByTransform[tr.id] ?? 0}
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {inspect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setInspect(null)}
        >
          <div className="card max-h-[80vh] w-full max-w-2xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <Pill tone={inspect.judgment.broke ? "bad" : "good"}>
                {inspect.judgment.broke ? "BYPASSED" : "RESISTED"}
              </Pill>
              <span className="text-sm font-medium">
                {TRANSFORMS.find((x) => x.id === inspect.transformId)?.name}
              </span>
              <button className="btn-ghost ml-auto text-xs" onClick={() => setInspect(null)}>
                Close
              </button>
            </div>
            <p className="mb-3 text-xs text-muted">{inspect.judgment.rationale}</p>
            <div className="label">Prompt sent</div>
            <pre className="mb-3 whitespace-pre-wrap rounded bg-bg p-2 font-mono text-[11px]">{inspect.prompt}</pre>
            <div className="label">Model response</div>
            <pre className="whitespace-pre-wrap rounded bg-bg p-2 font-mono text-[11px]">{inspect.response}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
