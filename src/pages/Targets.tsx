import { useStore, uid } from "@/lib/store";
import type { Target } from "@/lib/types";
import { useState } from "react";
import { Pill } from "@/components/ui";

const KINDS: Target["kind"][] = ["web", "api", "mobile", "llm", "network", "other"];

export default function Targets() {
  const targets = useStore((s) => s.targets);
  const addTarget = useStore((s) => s.addTarget);
  const updateTarget = useStore((s) => s.updateTarget);
  const removeTarget = useStore((s) => s.removeTarget);
  const [open, setOpen] = useState(false);

  function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const authorized = form.get("authorized") === "on";
    const now = new Date().toISOString();
    const t: Target = {
      id: uid(),
      name: String(form.get("name")) || "Untitled",
      scope: String(form.get("scope")),
      kind: String(form.get("kind")) as Target["kind"],
      program: String(form.get("program")) || undefined,
      authorized,
      authorizedAt: authorized ? now : undefined,
      notes: String(form.get("notes")) || undefined,
      createdAt: now,
    };
    addTarget(t);
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Targets &amp; Scope</h1>
          <p className="mt-1 text-sm text-muted">
            Define exactly what you are authorized to test. Scanning is gated on authorization.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setOpen((v) => !v)}>
          + Add target
        </button>
      </div>

      <div className="card border-high/30 bg-high/5 text-sm text-high">
        ⚠ Only add assets you own or have explicit written permission to test (e.g. a bug-bounty
        program's in-scope list). You are responsible for staying within scope and policy.
      </div>

      {open && (
        <form onSubmit={create} className="card grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" required placeholder="Acme Production" />
          </div>
          <div>
            <label className="label">Scope</label>
            <input name="scope" className="input" placeholder="*.acme.com, api.acme.com" />
          </div>
          <div>
            <label className="label">Kind</label>
            <select name="kind" className="input" defaultValue="web">
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Program (optional)</label>
            <input name="program" className="input" placeholder="hackerone-handle" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <input name="notes" className="input" placeholder="Out-of-scope paths, rate limits…" />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="authorized" className="h-4 w-4 accent-brand" />
            I confirm I am authorized to test this target under its policy.
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn-primary" type="submit">
              Add
            </button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {targets.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{t.name}</div>
                <code className="text-xs text-muted">{t.scope}</code>
              </div>
              <Pill tone={t.authorized ? "good" : "bad"}>
                {t.authorized ? "authorized" : "not authorized"}
              </Pill>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Pill>{t.kind}</Pill>
              {t.program && <Pill>program: {t.program}</Pill>}
            </div>
            {t.notes && <p className="mt-3 text-sm text-muted">{t.notes}</p>}
            <div className="mt-4 flex gap-2">
              <button
                className="btn-ghost text-xs"
                onClick={() =>
                  updateTarget(t.id, {
                    authorized: !t.authorized,
                    authorizedAt: !t.authorized ? new Date().toISOString() : undefined,
                  })
                }
              >
                {t.authorized ? "Revoke authorization" : "Mark authorized"}
              </button>
              <button
                className="btn-ghost text-xs"
                onClick={() => confirm("Remove target?") && removeTarget(t.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
