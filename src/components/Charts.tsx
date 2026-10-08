import type { Severity } from "@/lib/types";
import { SEV_COLOR } from "./ui";

/** Accessible donut: distinct hues + visible labels, not color-only. */
export function SeverityDonut({ data }: { data: Record<Severity, number> }) {
  const order: Severity[] = ["critical", "high", "medium", "low", "info"];
  const total = order.reduce((s, k) => s + data[k], 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1a2233" strokeWidth="16" />
        {total > 0 &&
          order.map((k) => {
            const frac = data[k] / total;
            const len = frac * c;
            const seg = (
              <circle
                key={k}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={SEV_COLOR[k]}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
        <text
          x="70"
          y="70"
          transform="rotate(90 70 70)"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-ink text-2xl font-semibold"
        >
          {total}
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {order.map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: SEV_COLOR[k] }}
            />
            <span className="capitalize text-muted">{k}</span>
            <span className="ml-auto font-medium tabular-nums">{data[k]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars for category counts. */
export function BarList({ items }: { items: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted">{i.label}</span>
            <span className="tabular-nums text-ink">{i.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full"
              style={{ width: `${(i.value / max) * 100}%`, background: i.color ?? "#4f8cff" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Radial robustness gauge 0..100. */
export function Gauge({ value }: { value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const len = (value / 100) * c;
  const color = value >= 80 ? "#4fd1c5" : value >= 50 ? "#ffd23f" : "#ff4d6d";
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#1a2233" strokeWidth="12" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${len} ${c - len}`}
      />
      <text
        x="60"
        y="60"
        transform="rotate(90 60 60)"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-ink text-xl font-semibold"
      >
        {value}
      </text>
    </svg>
  );
}
