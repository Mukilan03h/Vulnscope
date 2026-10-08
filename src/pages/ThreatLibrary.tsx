import { useState } from "react";
import { ATTACK_TECHNIQUES, type AttackTechnique } from "@/lib/llm/attacks";
import { OWASP_LLM } from "@/lib/llm/probes";
import { Pill } from "@/components/ui";

const TONE: Record<AttackTechnique["severity"], string> = {
  critical: "border-crit/40 bg-crit/5",
  high: "border-high/30 bg-high/5",
  medium: "border-med/30 bg-med/5",
};

export default function ThreatLibrary() {
  const [open, setOpen] = useState<string | null>(ATTACK_TECHNIQUES[0]?.id ?? null);
  const owaspKeys = [...new Set(ATTACK_TECHNIQUES.map((a) => a.owasp))];
  const [filter, setFilter] = useState<string>("all");

  const list = ATTACK_TECHNIQUES.filter((a) => filter === "all" || a.owasp === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Threat Library</h1>
        <p className="mt-1 text-sm text-muted">
          How an adversary could attack an LLM feature — and exactly how to detect and defend
          against each technique. Test your own system with the LLM Red-Team module, then apply
          these defenses to anything that gets through.
        </p>
      </div>

      <div className="card border-brand/30 bg-brand/5 text-sm text-ink/90">
        🛡 <strong>Defensive use.</strong> These are attack <em>techniques</em> (structural
        bypass methods), not operational payloads for producing harmful content. Knowing the
        technique is what lets you harden against it — the specific harmful ask an attacker
        appends is irrelevant to whether your guardrail holds.
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          className={`btn-ghost text-xs ${filter === "all" ? "border-brand/60 text-ink" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {owaspKeys.map((k) => (
          <button
            key={k}
            className={`btn-ghost text-xs ${filter === k ? "border-brand/60 text-ink" : ""}`}
            onClick={() => setFilter(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((a) => {
          const isOpen = open === a.id;
          return (
            <div key={a.id} className={`card ${TONE[a.severity]}`}>
              <button
                className="flex w-full items-center gap-2 text-left"
                onClick={() => setOpen(isOpen ? null : a.id)}
              >
                <Pill>{a.owasp}</Pill>
                <span className="font-medium">{a.name}</span>
                <span
                  className={`ml-auto text-xs font-semibold uppercase ${
                    a.severity === "critical"
                      ? "text-crit"
                      : a.severity === "high"
                        ? "text-high"
                        : "text-med"
                  }`}
                >
                  {a.severity}
                </span>
                <span className="text-muted">{isOpen ? "▾" : "▸"}</span>
              </button>

              {a.aka && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.aka.map((x) => (
                    <Pill key={x}>{x}</Pill>
                  ))}
                </div>
              )}

              {isOpen && (
                <div className="mt-4 space-y-4 text-sm">
                  <div className="text-xs uppercase tracking-wide text-muted">
                    {OWASP_LLM[a.owasp]}
                  </div>
                  <Block title="How it works">{a.howItWorks}</Block>
                  <Block title="Benign test vector">{a.testVector}</Block>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ListBlock title="Detection signals" items={a.detection} tone="bad" />
                    <ListBlock title="Defenses" items={a.defenses} tone="good" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label">{title}</div>
      <p className="text-ink/90">{children}</p>
    </div>
  );
}

function ListBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad";
}) {
  return (
    <div>
      <div className="label">{title}</div>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-ink/90">
            <span className={tone === "good" ? "text-low" : "text-crit"}>
              {tone === "good" ? "✓" : "•"}
            </span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
