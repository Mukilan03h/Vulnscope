import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", icon: "▦", end: true },
  { to: "/findings", label: "Findings", icon: "⚑" },
  { to: "/llm", label: "LLM Red-Team", icon: "⬡" },
  { to: "/targets", label: "Targets & Scope", icon: "◎" },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand font-bold text-white">
            V
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">VulnScope</div>
            <div className="text-[10px] uppercase tracking-widest text-muted">
              assess · red-team
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-brand/15 text-ink ring-1 ring-brand/40"
                    : "text-muted hover:bg-surface2 hover:text-ink"
                }`
              }
            >
              <span className="w-4 text-center text-base">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-border bg-surface2 p-3 text-[11px] leading-relaxed text-muted">
          Authorized testing only. Use VulnScope against assets you own or are
          explicitly permitted to test.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-surface/60 px-5 py-3 backdrop-blur md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">
            V
          </div>
          <span className="font-semibold">VulnScope</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
