# Receipts

Evidence-backed agreement and scope tracker for freelancers and small agencies.

---

## 1. Overview

Receipts helps freelancers and boutique agencies distinguish between original commitments, proposed alterations, mutually confirmed changes, ambiguous terms, and dismissed items.

### The Defining Workflow
1. **Identify an unconfirmed agreement:** Flag discrepancies, new requests, or shifted timelines in raw communication.
2. **Show verified evidence:** Check and anchor every claim against verbatim text snippets.
3. **Draft a clarification:** Produce clear, non-confrontational phrasing to confirm scope or quote additional costs.
4. **Update the ledger:** Modify the canonical record of agreement **only after explicit human confirmation**.

---

## 2. Implementation Status

| Feature / Area | Status | Notes |
|---|---|---|
| **Project Foundation** | **Completed** | Next.js App Router, TypeScript, Tailwind CSS, ESLint, `openai`, `zod`. |
| **Model Evaluation** | Planned (Phase 2) | Benchmarking extraction against Nebius Token Factory live endpoints. |
| **Evidence Extraction & Verification** | Planned (Phase 2) | Verbatim substring verification engine and schema parser. |
| **Agreement Ledger & UI Panels** | Planned (Phase 3) | 5-panel interface (Evidence, Ledger, Analysis, Draft, Trace). |
| **Markdown Export** | Planned (Phase 3) | Portable markdown agreement exports. |

> **Note:** The full user-facing extraction workflow, model evaluation, and final interface are not implemented yet. The application currently displays a foundational placeholder.

---

## 3. Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Validation:** Zod
- **Model Client:** OpenAI SDK (configured for Nebius Token Factory endpoints)

---

## 4. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js v24.20.0)
- npm 9+ (tested on npm 11.19.0)

### Installation
Clone or open the repository, then install dependencies:
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your credentials:
```env
NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1/
NEBIUS_API_KEY=your_nebius_api_key_here
NEBIUS_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct
```
*Note: Ensure valid model names are selected from the active Nebius/NVIDIA catalog.*

### Development Server
Run the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quality Checks
```bash
npm run lint
npm run build
```

---

## 5. Architecture & Documentation

- [SPEC.md](file:///d:/New%20folder/SPEC.md): Target users, workflow, 5 statuses, 4 commitment types, non-goals, and fallbacks.
- [DESIGN.md](file:///d:/New%20folder/DESIGN.md): Visual direction, panel layout, and semantic evidence states.
- [DECISIONS.md](file:///d:/New%20folder/DECISIONS.md): Architectural decisions and open questions.
- [STATUS.md](file:///d:/New%20folder/STATUS.md): Current implementation progress and next milestones.

---

## 6. Model Evaluation (Measured Reliability v1)

The repository provides a repeatable evaluation harness (`eval:live`) for testing extraction performance against the Nebius Token Factory (`nvidia/Nemotron-3_5-Lightning`).

### Running the Evaluation
- **No-network preview (safe, 0 API calls):**
  ```bash
  npm run eval:live
  ```
- **Live evaluation (consumes Nebius credits; requires `NEBIUS_API_KEY`):**
  ```bash
  npm run eval:live -- --yes
  ```
- **Target a specific scenario or run count:**
  ```bash
  npm run eval:live -- --yes --runs 1 --only case-01-clear-baseline-scope
  ```

### Evaluation Results
*Live evaluation results will be published here after executing the evaluation harness with active Nebius credentials. Results are saved to `eval-results/summary.json` with per-run raw outputs stored in `eval-results/raw/`.*

The evaluation measures:
- **Exact-match classification accuracy** (speech act, suggested status, commitment type)
- **Mechanical verification** (schema validity, quote existence)
- **Overstatement rate & confidently wrong count** (model proposing baseline or asserting higher status)
- **Whole-response failures & failure-stage breakdown** (network, truncation, parsing, schema violation)
- **Latency distribution** (p50, p95) and token accounting
- **Run-to-run status instability** (measuring agreement variance across multiple runs per scenario)
