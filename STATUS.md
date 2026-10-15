# Receipts Project Status

## 1. Phase 1: Project Foundation (Completed)

- [x] Initialized Git repository in workspace root (`d:\New folder`, now renamed to `D:\Receipts`).
- [x] Scaffolded Next.js App Router application with TypeScript, Tailwind CSS, ESLint, and `src/` directory.
- [x] Installed minimal dependencies: `openai` and `zod`.
- [x] Authored core documentation suite: `SPEC.md`, `DESIGN.md`, `DECISIONS.md`, `STATUS.md`, `README.md`, `LICENSE`, `.env.example`.
- [x] Configured `.gitignore` to prevent secret or artifact leakage.
- [x] Replaced default Next.js starter page with project placeholder stating workflow is not yet implemented.
- [x] Verified build and lint clean without errors.

---

## 2. Phase 2: Evidence Verification, Extraction Schema, Prompt & Evaluation (In Progress)

### Completed Locally:
- [x] Implemented deterministic evidence verification utility in `src/lib/verifier.ts`.
  - Verbatim exact match checking.
  - Normalization for Unicode quotation marks/apostrophes and multiline whitespace differences without allowing material wording changes.
  - Granular result typing (`verified: true` with matched indices vs. `verified: false` with specific failure reasons: `EMPTY_QUOTE`, `EMPTY_SOURCE`, `QUOTE_NOT_FOUND`, `MATERIAL_MISMATCH`).
- [x] Defined extraction schema in `src/lib/schema.ts` using Zod:
  - 4 commitment types: `deliverables`, `revision_limits`, `deadlines`, `prices`.
  - 7 speech acts: `request`, `proposal`, `question`, `acceptance`, `rejection`, `commitment`, `information`.
  - 3 model-suggested statuses: `baseline`, `proposed`, `unclear`. (Terminal statuses `confirmed` and `dismissed` strictly forbidden from model output).
  - 3 confidence labels: `low`, `medium`, `high`.
  - Fully validated `ExtractedCandidate` and `ExtractionResult` container schemas.
- [x] Authored 12 offline synthetic evaluation scenarios in `src/lib/evaluation-cases.ts`.
- [x] Implemented extraction prompt builder and safety guardrails in `src/lib/extraction-prompt.ts`:
  - Enforces 4 commitment types, 7 speech acts, and only 3 suggested statuses (`baseline`, `proposed`, `unclear`).
  - Strictly prohibits model from outputting `confirmed` or `dismissed`.
  - Enforces verbatim quotation copying without hallucination or paraphrasing.
  - Delimits untrusted client communications inside `<<<UNTRUSTED_COMMUNICATION_SOURCE>>>` boundary tags.
  - Formulates instructions to ignore embedded directives/injections in client source text.
  - Mandates returning `{"candidates": []}` when evidence is insufficient or ambiguous.
  - Matches `ExtractionResultSchema` output without schema divergence.
- [x] Implemented offline extraction evaluation engine in `src/lib/evaluate-extraction.ts`:
  - Validates candidates against `ExtractionResultSchema` and `ExtractedCandidateSchema`.
  - Mechanically verifies all quotes against source text via `verifyEvidence`.
  - Evaluates separate dimensions with explicit counts, denominators, and percentages: schema validity, quote existence, claim evidence support, speech-act classification, suggested-status classification, and overall case outcome.
  - Strictly distinguishes mechanical verification from human-annotated ground-truth correctness.
  - Attaches explicit methodological disclaimer: verbatim quote verification does not prove claim truth.
  - Penalizes missing, malformed, or extraneous candidates without silent skips.
  - Provides case-level diagnostics and suite-level aggregation (`evaluateScenario`, `evaluateExtraction`, `evaluateScenarioSuite`).
- [x] Authored unit test suites (52 tests passing across 22 test suites via `npm test`):
  - `src/lib/verifier.test.ts` (16 tests).
  - `src/lib/schema.test.ts` (13 tests).
  - `src/lib/extraction-prompt.test.ts` (11 tests).
  - `src/lib/evaluate-extraction.test.ts` (12 tests covering correct matches, fabricated quotes, classification mismatches, malformed inputs, missing/extraneous candidates, disclaimer validation, and suite aggregation).
- [x] Quality checks clean: `npm test`, `npm run lint`, `npm run build`, and `git diff --check` all passing with 0 errors and 0 warnings.

### What Remains Untested / Pending External Integration:
- [ ] Live inference with Nebius Token Factory / NVIDIA Nemotron models against the 12 scenarios.
  *(Note: All current evaluation tests use synthetic/simulated unit-test fixtures to test the evaluation engine itself; no live model has been benchmarked yet).*
- [ ] Real-world model latency and token consumption metrics.
- [ ] Live runner script connecting the evaluation engine to actual Nebius API endpoints.

---

## 3. Current Blockers

- **None currently blocking.**
- All verifier, schema, prompt, evaluation engine, and scenario fixtures execute 100% locally with zero external API dependencies or mock credentials.

---

## 4. Next Milestones

### Phase 2: Live Model Evaluation Runner
- Implement live evaluation script (`src/lib/evaluate-models.ts`) to feed the 12 evaluation scenarios through real Nebius API endpoints into `evaluateScenarioSuite`.
- Benchmark candidate models on extraction accuracy, verbatim evidence fidelity, and JSON schema compliance.
- Select winning production model and configure fallback parameters.

### Phase 3: Agreement Ledger & UI Panels
- Implement the 5-panel interface (Evidence Workspace, Ledger, Request Analysis, Reply Draft, Execution Trace).
- Implement human-in-the-loop confirmation workflow.
- Implement Markdown ledger export.
