import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Finding, LlmTarget, ScanRun, Target } from "@/lib/types";
import { SEED_FINDINGS, SEED_TARGETS } from "@/lib/seed";

interface State {
  targets: Target[];
  findings: Finding[];
  llmTargets: LlmTarget[];
  scans: ScanRun[];

  addTarget: (t: Target) => void;
  updateTarget: (id: string, patch: Partial<Target>) => void;
  removeTarget: (id: string) => void;

  addFinding: (f: Finding) => void;
  updateFinding: (id: string, patch: Partial<Finding>) => void;
  removeFinding: (id: string) => void;

  addLlmTarget: (t: LlmTarget) => void;
  updateLlmTarget: (id: string, patch: Partial<LlmTarget>) => void;
  removeLlmTarget: (id: string) => void;

  addScan: (s: ScanRun) => void;
  resetSeed: () => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      targets: SEED_TARGETS,
      findings: SEED_FINDINGS,
      llmTargets: [],
      scans: [],

      addTarget: (t) => set((s) => ({ targets: [t, ...s.targets] })),
      updateTarget: (id, patch) =>
        set((s) => ({ targets: s.targets.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTarget: (id) => set((s) => ({ targets: s.targets.filter((t) => t.id !== id) })),

      addFinding: (f) => set((s) => ({ findings: [f, ...s.findings] })),
      updateFinding: (id, patch) =>
        set((s) => ({
          findings: s.findings.map((f) =>
            f.id === id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f
          ),
        })),
      removeFinding: (id) => set((s) => ({ findings: s.findings.filter((f) => f.id !== id) })),

      addLlmTarget: (t) => set((s) => ({ llmTargets: [t, ...s.llmTargets] })),
      updateLlmTarget: (id, patch) =>
        set((s) => ({
          llmTargets: s.llmTargets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeLlmTarget: (id) =>
        set((s) => ({ llmTargets: s.llmTargets.filter((t) => t.id !== id) })),

      addScan: (sc) => set((s) => ({ scans: [sc, ...s.scans] })),
      resetSeed: () => set({ targets: SEED_TARGETS, findings: SEED_FINDINGS }),
    }),
    {
      name: "vulnscope-v1",
      // Do not persist API keys to disk by default — keep them in memory only.
      partialize: (s) => ({
        targets: s.targets,
        findings: s.findings,
        scans: s.scans,
        llmTargets: s.llmTargets.map((t) => ({ ...t, apiKey: undefined })),
      }),
    }
  )
);

export const uid = () =>
  (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
