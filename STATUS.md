# Receipts Project Status

## 1. Phase 1: Project Foundation (Completed)

- [x] Initialized Git repository in workspace root (`d:\New folder`).
- [x] Scaffolded Next.js App Router application with TypeScript, Tailwind CSS, ESLint, and `src/` directory.
- [x] Installed minimal dependencies: `openai` and `zod`.
- [x] Authored core documentation suite: `SPEC.md`, `DESIGN.md`, `DECISIONS.md`, `STATUS.md`, `README.md`, `LICENSE`, `.env.example`.
- [x] Configured `.gitignore` to prevent secret or artifact leakage.
- [x] Replaced default Next.js starter page with project placeholder stating workflow is not yet implemented.
- [x] Verified build and lint clean without errors.

---

## 2. Phase 2: Evidence Verification, Extraction Schema & Evaluation (In Progress)

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
- [x] Authored 12 offline synthetic evaluation scenarios in `src/lib/evaluation-cases.ts`:
  - 1. Clear baseline scope kickoff.
  - 2. Additional feature scope request.
  - 3. Conditional assent ("let me check with my partner").
  - 4. Unclear authority acceptance (intern approval).
  - 5. Option B predefined choice.
  - 6. Vague revision threshold ("a few rounds").
  - 7. Milestone deadline advancement.
  - 8. Contradictory prices across messages ($150/hr vs $100/hr).
  - 9. Superseding proposal (substituting icons for animations).
  - 10. Smart quotes and soft line breaks.
  - 11. Adversarial prompt injection in client text.
  - 12. Hallucinated / fabricated quotation (negative verification test).
- [x] Authored unit test suites:
  - `src/lib/verifier.test.ts` (16 tests).
  - `src/lib/schema.test.ts` (13 tests validating schemas, terminal status rejection, and 12-scenario fixtures with verifier grounding).
  - Total: 29 tests passing via Node.js test runner (`npm test`).
- [x] Quality checks clean: `npm test`, `npm run lint`, `npm run build`, and `git diff --check` all passing with 0 errors.

### What Remains Untested / Pending External Integration:
- [ ] Live inference with Nebius Token Factory / NVIDIA models against the 12 scenarios.
- [ ] Real-world model latency and token consumption metrics.
- [ ] Accuracy evaluation script measuring model extraction agreement against `EVALUATION_SCENARIOS`.

---

## 3. Current Blockers

- **None currently blocking.**
- All verifier, schema, and evaluation scenario code executes 100% locally with zero external API dependencies or mock credentials.

---

## 4. Next Milestones

### Phase 2: Live Model Evaluation Harness
- Implement evaluation runner script (`src/lib/evaluate-models.ts` or similar) to execute the 12 evaluation scenarios against real Nebius API endpoints.
- Score candidate models on extraction accuracy, verbatim evidence fidelity, and JSON schema compliance.
- Select winning production model and configure fallback parameters.

### Phase 3: Agreement Ledger & UI Panels
- Implement the 5-panel interface (Evidence Workspace, Ledger, Request Analysis, Reply Draft, Execution Trace).
- Implement human-in-the-loop confirmation workflow.
- Implement Markdown ledger export.
