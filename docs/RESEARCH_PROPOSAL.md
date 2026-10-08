# Research Proposal

## Cross-Model Transferability of Black-Box Jailbreak Techniques: A Systematic Empirical Study

**Status:** draft proposal · **Artifact:** VulnScope (this repository)

---

### 1. Abstract (draft)
Large language models are deployed behind APIs where an attacker has no access to
weights or gradients, yet black-box "jailbreak" techniques — persona framing,
prefix injection, encoding, payload splitting, many-shot priming — are widely
reported to bypass safety guardrails. What is *not* well characterized is how
these techniques **transfer across model families**: does a technique that breaks
Model A also break Model B, and are some techniques universally effective while
others are model-specific? We present a systematic, reproducible black-box study
measuring the Attack Success Rate (ASR) of N techniques across M models using a
benign-proxy behavior set and an automated judge. We report per-technique and
per-model ASR, cross-family transfer, and the correlation between model size /
family / release date and robustness. Our harness and benchmark are released as
open source.

### 2. The gap / why it's novel
- Prior work (garak, PyRIT, HarmBench) provides *tools and datasets* but few
  studies isolate **technique-level transfer across families** in a controlled
  matrix.
- Most jailbreak papers optimize a *new* attack on one or two models; few
  measure the **portfolio** of known techniques head-to-head across many models.
- A clean "which technique transfers where, and why" result is useful to both
  defenders (prioritize patching) and the measurement literature.

### 3. Research questions
- **RQ1.** What is the ASR of each black-box technique, per model?
- **RQ2.** Which techniques transfer across model families (train on family X,
  does ASR hold on family Y)?
- **RQ3.** Does robustness correlate with model size, family, or release recency?
- **RQ4.** Does combining techniques (composition) raise ASR super-additively?

### 4. Method
1. **Behavior set.** Use the benign-proxy behaviors in `src/lib/llm/behaviors.ts`
   (marker-leak + refusal-consistency). These measure whether the *guardrail /
   instruction hierarchy* breaks without generating harmful content, which keeps
   the study safe and reproducible. Optionally extend with a published academic
   behavior set under institutional authorization for an appendix comparison.
2. **Techniques.** The transforms in `src/lib/llm/transforms.ts` (raw baseline,
   direct override, persona, prefix injection, refusal suppression, base64/ROT13/
   leetspeak/zero-width obfuscation, payload splitting, many-shot, crescendo,
   fiction, translation). Each wraps every behavior → a technique × behavior
   matrix.
3. **Targets.** A set of instruction-tuned models reachable by API or local
   inference, spanning ≥3 families and ≥2 sizes each (e.g. small/medium variants
   within each family). Record exact model IDs and dates.
4. **Judge.** Heuristic judge (`judge.ts`) for marker behaviors; an LLM-as-judge
   (a separate, held-out strong model) for refusal behaviors, validated against a
   human-labeled subset (report inter-annotator agreement, following
   JailbreakBench practice).
5. **Runner.** `matrix.ts` computes ASR per technique and per behavior; repeat
   each cell k times (k≥3) at temperature 0 and report mean ± std to control for
   nondeterminism.

### 5. Metrics
- **ASR** per (technique, model) and marginal ASR by technique and by model.
- **Transfer score:** correlation / rank-agreement of per-technique ASR between
  model families.
- **Robustness vs. covariates:** regression of model ASR on size / family / date.
- **Composition gain:** ASR(technique A∘B) − max(ASR(A), ASR(B)).
- **Judge validity:** agreement with human labels on a sampled subset.

### 6. Baselines & controls
- **Raw baseline** transform = send the goal unmodified → establishes the
  no-attack refusal rate per model.
- Control behaviors the model *should* comply with → confirms the judge isn't
  just measuring general refusal/over-refusal.

### 7. Expected contributions
1. A reproducible **black-box technique × model ASR benchmark** + open harness.
2. The first systematic **cross-family transfer map** of known black-box
   techniques.
3. Actionable guidance: which techniques defenders should prioritize because
   they transfer broadly.

### 8. Feasibility
- **Compute:** API-only is sufficient; small local models (≤8B) run on a single
  GPU/Colab. No training required — this is measurement.
- **Data:** self-contained (benign proxies shipped in this repo).
- **Time:** pilot in days; full matrix in 2–4 weeks; writing in 3–4 weeks.

### 9. Ethics & responsible disclosure
- Study measures *whether guardrails hold* using benign proxies; it does not
  generate or release harmful content.
- Only models the authors own or are authorized/licensed to query are tested,
  within each provider's terms.
- Any model-specific weakness that is novel and sensitive is disclosed to the
  provider before publication.
- The released artifact ships benign proxies only, consistent with garak/PyRIT.

### 10. Target venues
- Workshops: an LLM-/AI-security or trustworthy-ML workshop (e.g. LLMSEC, SoLaR,
  SafeGenAI, or a NeurIPS/ICLR/ACL-affiliated security workshop).
- Preprint on arXiv (cs.CR / cs.CL) in parallel.

### 11. Work plan
| Phase | Output |
|---|---|
| Pilot | ASR for 3 techniques × 3 models; confirm signal and judge validity |
| Full run | Complete matrix, k-repeats, covariate data |
| Analysis | Transfer map, regressions, composition experiment |
| Writing | Draft → internal review → arXiv + workshop submission |

### 12. Reproducibility checklist
- Exact model IDs, dates, decoding params, k-repeats logged.
- Harness, behavior set, and judge prompts released in this repo.
- Raw per-cell outputs exported as JSON (Attack Lab already supports this).

---
_This proposal uses VulnScope as its experimental apparatus. See `src/lib/llm/`
for the transforms, behaviors, judge, and matrix runner that implement the method._
