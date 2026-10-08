import type { LlmTarget } from "@/lib/types";
import type { Behavior } from "./behaviors";
import { TRANSFORMS, type Transform } from "./transforms";
import { chat, type ChatMessage } from "./providers";
import { heuristicJudge, llmJudge, type Judgment } from "./judge";

export interface AttackCell {
  behaviorId: string;
  transformId: string;
  prompt: string;
  response: string;
  judgment: Judgment;
}

export interface MatrixReport {
  id: string;
  targetLabel: string;
  model: string;
  startedAt: string;
  finishedAt?: string;
  cells: AttackCell[];
  // success rate (attacker POV) per transform and per behavior
  asrByTransform: Record<string, number>;
  asrByBehavior: Record<string, number>;
  overallAsr: number; // attack success rate across all cells
}

export interface MatrixOptions {
  behaviors: Behavior[];
  transformIds: string[];
  judgeTarget?: LlmTarget; // optional LLM judge for non-refusal behaviors
  onProgress?: (done: number, total: number, cell?: AttackCell) => void;
  signal?: AbortSignal;
}

async function runCell(
  target: LlmTarget,
  b: Behavior,
  t: Transform,
  judgeTarget?: LlmTarget,
  signal?: AbortSignal
): Promise<AttackCell> {
  const attack = t.apply(b.goal);
  const messages: ChatMessage[] = [];
  const system = attack.system ?? b.system;
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: attack.prompt });

  let response = "";
  let judgment: Judgment;
  try {
    response = await chat(target, messages, signal);
    if (b.judge === "non-refusal" && judgeTarget) {
      judgment = await llmJudge(judgeTarget, b.goal, response, signal);
    } else {
      judgment = heuristicJudge(b, response);
    }
  } catch (e) {
    response = `[error] ${(e as Error).message}`;
    judgment = { broke: false, confidence: 0, rationale: "Request failed." };
  }

  return { behaviorId: b.id, transformId: t.id, prompt: attack.prompt, response, judgment };
}

export async function runMatrix(
  target: LlmTarget,
  opts: MatrixOptions
): Promise<MatrixReport> {
  const transforms = TRANSFORMS.filter((t) => opts.transformIds.includes(t.id));
  const startedAt = new Date().toISOString();
  const cells: AttackCell[] = [];
  const total = opts.behaviors.length * transforms.length;
  let done = 0;

  for (const b of opts.behaviors) {
    for (const t of transforms) {
      if (opts.signal?.aborted) break;
      const cell = await runCell(target, b, t, opts.judgeTarget, opts.signal);
      cells.push(cell);
      done++;
      opts.onProgress?.(done, total, cell);
    }
  }

  const rate = (subset: AttackCell[]) =>
    subset.length ? Math.round((subset.filter((c) => c.judgment.broke).length / subset.length) * 100) : 0;

  const asrByTransform: Record<string, number> = {};
  for (const t of transforms) asrByTransform[t.id] = rate(cells.filter((c) => c.transformId === t.id));

  const asrByBehavior: Record<string, number> = {};
  for (const b of opts.behaviors) asrByBehavior[b.id] = rate(cells.filter((c) => c.behaviorId === b.id));

  return {
    id: crypto.randomUUID(),
    targetLabel: target.label,
    model: target.model,
    startedAt,
    finishedAt: new Date().toISOString(),
    cells,
    asrByTransform,
    asrByBehavior,
    overallAsr: rate(cells),
  };
}
