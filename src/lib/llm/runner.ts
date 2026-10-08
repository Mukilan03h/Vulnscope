import type { LlmTarget, ProbeResult, ScanRun } from "@/lib/types";
import { PROBES, type Probe } from "./probes";
import { evaluate } from "./detectors";
import { chat, type ChatMessage } from "./providers";

export interface RunOptions {
  probeIds?: string[]; // subset; default all
  onProgress?: (done: number, total: number, last?: ProbeResult) => void;
  signal?: AbortSignal;
}

async function runProbe(target: LlmTarget, probe: Probe, signal?: AbortSignal): Promise<ProbeResult> {
  const messages: ChatMessage[] = [];
  if (probe.system) messages.push({ role: "system", content: probe.system });
  messages.push({ role: "user", content: probe.prompt });

  let response = "";
  let verdict = { passed: false, rationale: "" };
  try {
    response = await chat(target, messages, signal);
    verdict = evaluate(probe, response);
  } catch (e) {
    response = `[error] ${(e as Error).message}`;
    verdict = { passed: false, rationale: "Request failed; could not evaluate." };
  }
  return {
    probeId: probe.id,
    category: probe.category,
    passed: verdict.passed,
    score: verdict.passed ? 1 : 0,
    prompt: probe.prompt,
    response,
    detector: probe.detector,
    rationale: verdict.rationale,
    at: new Date().toISOString(),
  };
}

export async function runScan(target: LlmTarget, opts: RunOptions = {}): Promise<ScanRun> {
  const probes = opts.probeIds
    ? PROBES.filter((p) => opts.probeIds!.includes(p.id))
    : PROBES;

  const results: ProbeResult[] = [];
  const startedAt = new Date().toISOString();

  for (let i = 0; i < probes.length; i++) {
    if (opts.signal?.aborted) break;
    const r = await runProbe(target, probes[i], opts.signal);
    results.push(r);
    opts.onProgress?.(i + 1, probes.length, r);
  }

  const totalWeight = probes.reduce((s, p) => s + p.weight, 0);
  const earned = results.reduce((s, r) => {
    const p = probes.find((x) => x.id === r.probeId)!;
    return s + (r.passed ? p.weight : 0);
  }, 0);
  const robustness = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;

  return {
    id: crypto.randomUUID(),
    llmTargetLabel: target.label,
    model: target.model,
    startedAt,
    finishedAt: new Date().toISOString(),
    results,
    robustness,
  };
}
