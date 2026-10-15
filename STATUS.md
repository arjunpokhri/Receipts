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
- [x] **Verification & Quality Checks (Phase 3):**
  - `npm.cmd test`: 52/52 tests passing.
  - `npm.cmd run lint`: 0 errors, 0 warnings.
  - `npm.cmd run build`: Compiled and prerendered static production build successfully.
  - `git diff --check`: 0 whitespace or formatting issues.

---

## 4. Phase 4: Nebius Token Factory API Integration (Completed Locally)

- [x] **Live Pre-Flight Smoke Test (`scripts/nebius-smoke-test.mjs`):**
  - Live verified: Authenticated against Nebius Token Factory (`https://api.tokenfactory.nebius.com/v1/`) with `nvidia/Nemotron-3_5-Lightning`.
  - Confirmed HTTP 200 and strict JSON response `{"status":"ok"}` using `response_format: { type: "json_object" }`.
  - Treated `finish_reason === "length"` as failure and verified zero API key leakage in logs.
- [x] **Server-Side Extraction Engine & Truncation Resolution (`src/lib/nebius-extraction.ts`):**
  - Server-side only: Uses `openai` SDK with `NEBIUS_API_KEY`, `NEBIUS_BASE_URL`, and `NEBIUS_MODEL` from environment.
  - Generates prompt messages via `buildExtractionMessages` with untrusted source boundary tags.
  - Bounded completion parameters: 4,096 max tokens and 45-second timeout.
  - Resolved reasoning truncation: Passes `chat_template_kwargs: { enable_thinking: false }` supported by vLLM/Nebius for `nvidia/Nemotron-3_5-Lightning` and explicitly instructs model in prompts to omit internal reasoning, preventing unbounded chain-of-thought token exhaustion.
  - Safe truncation diagnostics: Captures completion tokens, reasoning tokens, and content presence without logging sensitive data.
  - Parses JSON output and handles thought tags (`<think>...</think>`) and code blocks.
  - Enforces `ExtractionResultSchema` from `src/lib/schema.ts` (strictly prohibiting `confirmed` or `dismissed`).
  - Mechanically verifies every extracted quote against the source text with `verifyEvidence`; marks invalid quotes as `quoteVerified: false`.
- [x] **Next.js API Route (`src/app/api/extract/route.ts`):**
  - `POST /api/extract` route handler with input validation (max 30,000 characters).
  - 45-second bounded request timeout and 4,096 max tokens.
  - Sanitized error responses (400, 422, 502, 503, 504, 500) that never expose keys, request headers, or stack traces.
- [x] **Mocked Unit Test Suite (`src/lib/nebius-extraction.test.ts`):**
  - Automated unit tests verifying valid extraction, schema violations (forbidden 'confirmed' status), fabricated quotes, malformed non-JSON, token limit truncation with safe metadata diagnostics, default 4,096 token ceiling, `chat_template_kwargs: { enable_thinking: false }` pass-through, `enableThinking: true` override, empty input, and network errors.
  - 100% mocked: 0 live API credits consumed during automated test execution.
  - Overall project test suite: **66/66 tests passing** across 25 suites.
- [x] **Live Workstation UI Integration (`src/components/CustomTextVerifier.tsx`):**
  - Dedicated "Source Analysis & Extraction Hub" in the "Live Extractor & Verifier" tab.
  - Full state lifecycle: Idle, Loading (with spinner and status explanation), Error (with clear diagnostic), Empty (clean message when no terms detected), and Success.
  - Displays extracted candidates with type, speech act, suggested status, and verified quote span badges.
  - Optional human-in-the-loop action: "Add to Active Ledger as [status]" allows user to promote extracted candidates to the active agreement ledger without silent overwriting.

---

## 5. Distinction: Implemented vs. Tested vs. Live-Verified

- **Live-Verified:**
  - Standalone connectivity and structured generation verified via `scripts/nebius-smoke-test.mjs` against `nvidia/Nemotron-3_5-Lightning` on Nebius Token Factory.
- **Implemented & Unit-Tested (Mocked):**
  - `src/lib/nebius-extraction.ts` and `src/app/api/extract/route.ts` are fully implemented and verified with 11 mocked unit tests. No automated tests make external network calls.
- **Human-Controlled In-Session Workflow:**
  - Sample project data in `SAMPLE_PROJECT` remains default and pristine. User-initiated extractions do not replace sample data unless the user explicitly clicks "Add to Active Ledger".

---

## 6. Next Steps & Limitations

1. **Production Evaluation Benchmark:** Run the 12 evaluation scenarios through the live endpoint to measure empirical accuracy metrics for Nemotron-3.5-Lightning.
2. **Git Commit:** Create Git commit when instructed by user.
