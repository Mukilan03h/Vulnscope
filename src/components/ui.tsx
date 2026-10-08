import type { ReactNode } from "react";
import type { Severity } from "@/lib/types";

const SEV_CLASS: Record<Severity, string> = {
  critical: "bg-crit/15 text-crit border-crit/40",
  high: "bg-high/15 text-high border-high/40",
  medium: "bg-med/15 text-med border-med/40",
  low: "bg-low/15 text-low border-low/40",
  info: "bg-info/15 text-info border-info/40",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${SEV_CLASS[severity]}`}
    >
      {severity}
    </span>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "good" | "bad" }) {
  const t =
    tone === "good"
      ? "bg-low/15 text-low border-low/40"
      : tone === "bad"
        ? "bg-crit/15 text-crit border-crit/40"
        : "bg-surface2 text-muted border-border";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${t}`}>
      {children}
    </span>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{children}</h2>
      {action}
    </div>
  );
}

export const SEV_COLOR: Record<Severity, string> = {
  critical: "#ff4d6d",
  high: "#ff8a3d",
  medium: "#ffd23f",
  low: "#4fd1c5",
  info: "#7aa2ff",
};
