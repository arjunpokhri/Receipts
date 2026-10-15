# Receipts Project Status

## 1. Phase 1: Project Foundation (Completed)

- [x] Initialized Git repository in workspace root (`d:\New folder`, now renamed to `D:\Receipts`).
- [x] Scaffolded Next.js App Router application with TypeScript, Tailwind CSS, ESLint, and `src/` directory.
- [x] Installed minimal dependencies: `openai` and `zod`.
- [x] Authored core documentation suite: `SPEC.md`, `DESIGN.md`, `DECISIONS.md`, `STATUS.md`, `README.md`, `LICENSE`, `.env.example`.
- [x] Configured `.gitignore` to prevent secret or artifact leakage.
- [x] Verified build and lint clean without errors.

---

## 2. Phase 2: Core Extraction, Verification & Evaluation Engine (Completed Locally)

- [x] **Deterministic Evidence Verification Utility (`src/lib/verifier.ts`):**
  - Verbatim exact match checking.
  - Normalization for Unicode quotation marks/apostrophes and multiline whitespace differences without allowing material wording changes.
  - Granular result typing (`verified: true` with matched indices vs. `verified: false` with specific failure reasons: `EMPTY_QUOTE`, `EMPTY_SOURCE`, `QUOTE_NOT_FOUND`, `MATERIAL_MISMATCH`).
- [x] **Extraction Schema (`src/lib/schema.ts`):**
  - 4 commitment types: `deliverables`, `revision_limits`, `deadlines`, `prices`.
  - 7 speech acts: `request`, `proposal`, `question`, `acceptance`, `rejection`, `commitment`, `information`.
  - 3 model-suggested statuses: `baseline`, `proposed`, `unclear`. (Terminal statuses `confirmed` and `dismissed` strictly forbidden from model output).
  - 3 confidence labels: `low`, `medium`, `high`.
  - Fully validated `ExtractedCandidate` and `ExtractionResult` container schemas.
- [x] **12 Offline Synthetic Evaluation Scenarios (`src/lib/evaluation-cases.ts`):**
  - Realistic edge cases covering scope commitments, feature requests, conditional acceptance, unauthorized signoff, option selection, vague revision limits, deadline changes, conflicting prices, superseding messages, Unicode/line breaks, prompt injection attempts, and fabricated quotes.
- [x] **Extraction Prompt Builder & Guardrails (`src/lib/extraction-prompt.ts`):**
  - Enforces 4 commitment types, 7 speech acts, and only 3 suggested statuses.
  - Strictly prohibits model from outputting `confirmed` or `dismissed`.
  - Delimits untrusted client communications inside `<<<UNTRUSTED_COMMUNICATION_SOURCE>>>` boundary tags.
  - Formulates instructions to ignore embedded directives/injections in client source text.
  - Mandates returning `{"candidates": []}` when evidence is insufficient or ambiguous.
- [x] **Offline Extraction Evaluation Engine (`src/lib/evaluate-extraction.ts`):**
  - Validates candidates against `ExtractionResultSchema` and `ExtractedCandidateSchema`.
  - Mechanically verifies all quotes against source text via `verifyEvidence`.
  - Evaluates separate dimensions with explicit counts, denominators, and percentages: schema validity, quote existence, claim evidence support, speech-act classification, suggested-status classification, and overall case outcome.
  - Strictly distinguishes mechanical verification from human-annotated ground-truth correctness.
  - Attaches explicit methodological disclaimer: verbatim quote verification does not prove claim truth.
  - Penalizes missing, malformed, or extraneous candidates without silent skips.
- [x] **Unit Test Suite (52/52 Passing):**
  - `src/lib/verifier.test.ts` (16 tests).
  - `src/lib/schema.test.ts` (13 tests).
  - `src/lib/extraction-prompt.test.ts` (11 tests).
  - `src/lib/evaluate-extraction.test.ts` (12 tests).

---

## 3. Phase 3: Workstation User Interface & Design System Refinements (Completed Locally)

- [x] **Visual Restraint & Design System:**
  - Enforced paper canvas (`#F6F5F0`), deep forest green (`#244D3A`), charcoal ink (`#20251F`), muted sage (`#E7EEE8`), warm amber (`#C58A36`), brick coral (`#C95C4B`), and emerald (`#2E7D5B`).
  - Removed premature dark-mode media query overrides that caused high-contrast inversions and unreadable black panels.
  - Softened borders to subtle 1px lines (`border-[#20251F]/10`) and eliminated heavy block drop-shadows.
- [x] **Typography Hierarchy:**
  - **Newsreader Serif:** Editorial project titles, section headings, and verbatim quotations (`font-serif italic`).
  - **Geist Sans:** Core interface elements, claims, descriptions, navigation, table headers, and status badges.
  - **Geist Mono:** Reserved strictly for genuinely technical metadata: timestamps, span indices, candidate IDs, and raw text logs.
  - Replaced aggressive all-caps uppercase labels across sidebar, bento cards, status badges, and table headers with clean, elegant title and sentence casing.
- [x] **Agreement Ledger Column Architecture & Clipping Resolution:**
  - Solved horizontal table clipping and narrow 1-word-per-line claim text.
  - Combined `Verbatim Quotation` with inline speaker and timestamp citation into one generous, readable column.
  - Sized columns with balanced proportions: Commitment & Scope (200px+), Type (95px), Status (95px), Quotation & Source (190px+), and Review Action (100px).
  - Made human-controlled **Confirm** and **Dismiss** action buttons 100% visible on the desktop screen without requiring horizontal scrolling.
- [x] **Calm, Integrated Evidence Inspector:**
  - Replaced dark glassmorphic box with a tranquil paper-white secondary panel (`bg-white border-[#20251F]/10 shadow-xs`).
  - Compacted vertical padding and transcript sizing to comfortably fit within standard desktop viewports.
  - Integrated dynamic layout in `page.tsx`: when inspector is closed, ledger expands to full 12-column width.
- [x] **Bundled Realistic Sample Project:**
  - Project: "Aura Health Inc. — Mobile Patient Portal Redesign".
  - Full transcripts and pre-extracted candidates demonstrating baseline terms, scope creep requests, and off-hours rate disputes.
- [x] **Verification & Quality Checks:**
  - `npm.cmd test`: 52/52 tests passing.
  - `npm.cmd run lint`: 0 errors, 0 warnings.
  - `npm.cmd run build`: Compiled and prerendered static production build successfully.
  - `git diff --check`: 0 whitespace or formatting issues.

---

## 4. What Remains Untested / Pending External Integration

- [ ] **Live Nebius Token Factory / NVIDIA Nemotron Inference:**
  - Live model API calls have not been executed yet.
  - Real-world latency, cost, and token consumption metrics will only be measured once live API credentials and endpoints are connected.
  - Current UI traces and verifiers strictly report local deterministic checks.
- [ ] **Git Commit:**
  - Per instructions, no Git commit has been created yet.

---

## 5. Next Steps

1. Create a Git commit for the completed Phase 3 UI implementation when instructed by the user.
2. Wire up the live Nebius API runner script to evaluate NVIDIA Nemotron models against the 12 evaluation scenarios.
3. Benchmark candidate models on extraction accuracy, verbatim evidence fidelity, and JSON schema compliance.
