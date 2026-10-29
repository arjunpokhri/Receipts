# Receipts Project Status

## Project Summary
- **Current Version:** `0.1.0`
- **Application Engine:** Next.js 16.4.3 (App Router with Turbopack) & React 19.3.0
- **Automated Test Suite:** **192 / 192 Passing Tests across 62 Suites** (`node --test`)
- **Build Status:** Clean production build (`npm run build`) with zero TypeScript, ESLint, or runtime errors.

---

## Phased Implementation Record

### Phase 1: Project Foundation & Architecture (Completed)
- [x] Initialized Git repository and configured TypeScript, ESLint, and Next.js App Router.
- [x] Installed foundational dependencies (`openai`, `zod`).
- [x] Authored architectural guidelines: `SPEC.md`, `DESIGN.md`, `DECISIONS.md`, `STATUS.md`, `README.md`, `LICENSE`, `.env.example`.
- [x] Configured `.gitignore` to prevent secret and artifact leakage.
- [x] Verified initial zero-error baseline with `npm run build` and `npm run lint`.

### Phase 2: Core Extraction, Verification & Evaluation Engine (Completed)
- [x] **Deterministic Substring Verifier (`src/lib/verifier.ts`):**
  - Character-level verbatim substring checking.
  - Normalization for Unicode quotation marks, curly apostrophes, and multiline whitespace without allowing lexical changes.
  - Granular result typing (`verified: true` with indices vs. `verified: false` with explicit reasons: `EMPTY_QUOTE`, `EMPTY_SOURCE`, `QUOTE_NOT_FOUND`, `MATERIAL_MISMATCH`).
- [x] **Extraction Schemas (`src/lib/schema.ts`):**
  - 4 commitment types: `deliverables`, `revision_limits`, `deadlines`, `prices`.
  - 7 speech acts: `request`, `proposal`, `question`, `acceptance`, `rejection`, `commitment`, `information`.
  - 3 model-suggested initial statuses: `baseline`, `proposed`, `unclear`. (Terminal statuses `confirmed` and `dismissed` strictly forbidden from model output).
  - Validation schemas for `ExtractedCandidate` and `ExtractionResult`.
- [x] **Extraction Prompt Builder & Guardrails (`src/lib/extraction-prompt.ts`):**
  - Strictly confines untrusted communication within `<<<UNTRUSTED_COMMUNICATION_SOURCE>>>` boundary tags to block prompt injection.
  - Emphasizes that ambiguous statements must be marked `unclear` or returned as empty candidate arrays.
- [x] **Offline Benchmark Scenarios (`src/lib/evaluation-cases.ts`):**
  - 17 realistic edge-case scenarios covering scope drift, conditional assent, unauthorized intern approvals, off-hours rates, and prompt injection attempts.
- [x] **Offline Extraction Evaluation Engine (`src/lib/evaluate-extraction.ts`):**
  - Multi-dimensional scoring: schema adherence, verbatim quote existence, speech-act classification, and status mapping.

### Phase 3: Workstation UI & Design System (Completed)
- [x] **Visual Design System:**
  - Archival ledger aesthetic: Paper canvas (`#F6F5F0`), deep forest green (`#244D3A`), charcoal ink (`#20251F`), muted sage (`#E7EEE8`), warm amber (`#C58A36`), brick coral (`#C95C4B`), and emerald (`#2E7D5B`).
  - Subtle borders (`border-[#20251F]/10`) and neo-brutalist tactile button accents (`shadow-[2px_2px_0px_#20251F]`).
- [x] **Typography Scale:**
  - Editorial headings & brand: `Newsreader` (`font-serif italic`).
  - Interface structure & controls: `Geist Sans`.
  - Audit indices, character counts, and timestamps: `Geist Mono`.
- [x] **Agreement Ledger Component:**
  - Responsive table layout preventing horizontal clipping.
  - Integrated filters (All, Baseline, Proposed, Confirmed, Unclear, Dismissed), search input, and inline Confirm/Dismiss/Restore controls.
- [x] **Evidence Inspector Panel:**
  - Tranquil slide-over panel displaying cited quotes in context with character offset badges and verification status.
- [x] **Bundled Sample Project:**
  - "Aura Health Inc. — Mobile Patient Portal Redesign" pre-loaded with representative agreements and pending creep items.

### Phase 4: Nebius Token Factory API Integration (Completed)
- [x] **Server-Side Extraction Route (`src/app/api/extract/route.ts`):**
  - Direct integration with `nvidia/Nemotron-3_5-Lightning` via OpenAI-compatible SDK.
  - Enforces 30,000 character input ceiling, 4,096 completion token limit, and 45-second bounded timeouts.
  - Configures `chat_template_kwargs: { enable_thinking: false }` to prevent unbounded reasoning token exhaustion.
  - Sanitized error responses preventing secret or internal trace leakage.
- [x] **Mechanical Re-Verification (`src/lib/nebius-extraction.ts`):**
  - Every LLM-returned quote is immediately verified by `verifyEvidence` before leaving the server.

### Phase 5: Trust Boundaries & Ledger State Invariants (Completed)
- [x] **Pure Domain Actions (`src/lib/ledger-actions.ts`):**
  - Rejects candidate addition if quote verification fails.
  - Automatically downgrades model-suggested `baseline` candidates from correspondence into `proposed` with an explanatory notice.
  - Attaches authoritative `sourceText` directly to ledger items.
  - Enforces strict confirmation and dismissal state machines.
  - Generic honest reviewer attribution (`"Human Reviewer"`).

### Phase 6: Source Integrity & Evidence-Grounded Clarifications (Completed)
- [x] **Authoritative Source Resolver (`src/lib/source-resolver.ts`):**
  - Resolves item sources without silent fallbacks.
  - Prioritizes item's own `sourceText` over sample threads.
- [x] **Evidence-Grounded Reply Generator (`src/lib/reply-draft.ts`):**
  - Dynamically synthesizes polite, non-confrontational clarification emails/messages citing the exact evidence quotes and scope implications.
  - Zero hardcoded sample strings; fallback gracefully when client or contractor names are omitted.

### Phase 7: Snapshot Freezing & Textarea Divergence (Completed)
- [x] **Immutable Source Snapshot (`src/lib/source-snapshot.ts`):**
  - Captures and trims text at the exact moment analysis is triggered.
  - Associates extracted candidates with a unique session ID.
  - Detects live textarea mutations and blocks stale candidate additions until re-extracted.

### Phase 8: Multi-Project Persistence & Local Storage (Completed)
- [x] **Project Storage Engine (`src/lib/project-storage.ts`):**
  - Complete multi-project lifecycle: create, switch, rename, and delete projects.
  - Persists customized ledger items, project metadata, and reviews across browser sessions in `localStorage`.
  - Migration utilities ensuring sample project integrity and fallback resilience.
- [x] **Project Modal Component (`src/components/ProjectModal.tsx`):**
  - Clean UI modal for creating new client projects and switching workspaces.

### Phase 9: Multi-Format Document Ingestion & Text Parsing (Completed)
- [x] **Document Parsing API Route (`src/app/api/parse-document/route.ts`):**
  - Ingests binary document uploads (`multipart/form-data`) up to 10MB.
  - **PDF (`.pdf`):** Decoded via lightweight `unpdf`.
  - **Word (`.docx`, `.doc`):** Deep text extraction via `mammoth`.
  - **Plain Text & Markdown (`.txt`, `.md`):** Native UTF-8 stream decoding.
  - Returns extracted text, file metadata, character count, and preview snippet.
- [x] **Document Ingestion UI (`src/components/CustomTextVerifier.tsx`):**
  - Drag-and-drop file upload zone alongside manual copy-paste input.
  - Automatic transfer of parsed document text directly into the extraction testbench.
- [x] **Unit Testing (`src/lib/parse-document.test.ts`):**
  - Validates document parsing logic, supported MIME types, and error handling.

### Phase 10: Guided Onboarding, Branding & Contrast Refinements (Completed)
- [x] **Interactive Onboarding Tour (`src/components/InteractiveTourModal.tsx`):**
  - Multi-step walkthrough guiding new users through the Agreement Ledger, Extraction Hub, Evidence Inspector, and Clarification Drafter.
- [x] **Brand Assets & Splash Experience (`src/components/LogoIntroOverlay.tsx`):**
  - Animated welcome overlay displaying the official Receipts verified logo badge.
  - Crisp high-contrast logo presentation preserved across both light and dark display modes.
- [x] **Modern UI Enhancements:**
  - Ambient `AuroraBackground` visual accents.
  - Tactile neo-brutalist buttons with accessible focus rings and high-contrast labels.

---

## Automated Test Inventory (192 Tests)

```
Test File                           Tests   Area Covered
─────────────────────────────────── ─────   ────────────────────────────────────────────────
src/lib/verifier.test.ts             16     Verbatim matching, Unicode quotes, whitespace variance
src/lib/schema.test.ts               13     Zod candidate, result, and status constraint validation
src/lib/extraction-prompt.test.ts    11     Prompt assembly, boundary tags, and injection defense
src/lib/evaluate-extraction.test.ts  12     Offline scoring engine and multi-metric aggregation
src/lib/nebius-extraction.test.ts    14     OpenAI SDK integration, truncation, and error handling
src/lib/ledger-actions.test.ts       23     State transitions, baseline downgrade, and immutability
src/lib/source-resolver.test.ts       7     Authoritative source resolution without silent fallback
src/lib/reply-draft.test.ts           7     Non-confrontational draft synthesis and placeholders
src/lib/source-snapshot.test.ts      11     Snapshot session association and divergence detection
src/lib/ledger-storage.test.ts       14     localStorage persistence and JSON schema parsing
src/lib/eval-metrics.test.ts         60     Pure mathematical evaluation metrics, rankings, & CLI
src/lib/parse-document.test.ts        4     Document parser route, supported types, and limits
─────────────────────────────────── ─────   ────────────────────────────────────────────────
TOTAL PASSING UNIT TESTS            192     All 192 tests pass deterministically (0 network calls)
```

---

## Verification & Build Commands

```bash
# Execute complete unit test suite
npm test

# Run code style and linter checks
npm run lint

# Compile production build
npm run build
```
