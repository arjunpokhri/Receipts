# Receipts

**Evidence-backed agreement and scope tracker for freelancers and boutique agencies.**

Receipts turns messy, unstructured client communication—Slack messages, emails, WhatsApp threads, meeting transcripts, and uploaded document files—into a structured, verified agreement ledger. Every extracted commitment is anchored directly to verbatim source text with mechanical character-span verification, stopping scope drift and contract misunderstandings before they turn into unpaid work.

---

## 1. Executive Summary & Problem Space

### The Core Problem
Freelance engineers, designers, copywriters, and boutique digital agencies lose thousands of dollars each month to subtle, incremental scope creep:
- **Casual Expansion:** A client offhandedly asks: *"Could we also add a 3D product viewer module right below the hero section?"*
- **Unauthorized Sign-Off:** An junior intern or non-commercial contact replies: *"Go ahead and start on that, looks good to me!"* without commercial sign-off authority.
- **Ambiguous Assent:** A stakeholder remarks: *"I need to run the $600 by finance first,"* leaving price approval unresolved.
- **Lost Thread Context:** Critical revisions, milestone shifts, and oral agreements occur across disparate channels (email, Slack, WhatsApp, phone recap notes, proposal PDFs).

Without a centralized, evidence-grounded record, agencies either deliver unpaid out-of-scope work or face awkward, relationship-damaging disputes at invoice time.

### The Receipts Solution
Receipts provides an audit-ready, human-in-the-loop workstation where:
1. **Unstructured communication or uploaded documents** are parsed and analyzed for commitments.
2. **Every candidate agreement** is mechanically grounded to exact character offsets in the source text.
3. **The LLM is strictly prohibited** from setting final status (`confirmed` or `dismissed`); only a human reviewer can approve terms.
4. **Clarification drafts** can be generated in one click to resolve ambiguous or unconfirmed scope before work begins.

---

## 2. Core Architecture & Workflow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. Ingestion Sources                            │
│  Pasted Text (Email/Slack/Chat)  │  Uploaded Files (PDF/DOCX/DOC/MD/TXT)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 2. Document Parser & Text Normalizer                   │
│         POST /api/parse-document (unpdf, mammoth, UTF-8 buffer)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              3. Semantic Inference Layer (Nebius Token Factory)         │
│          POST /api/extract (nvidia/Nemotron-3_5-Lightning)              │
│       - Categorizes into 4 commitment types & 7 speech acts            │
│       - Suggests initial status: baseline, proposed, unclear           │
│       - Strict Guardrails: Forbidden from setting confirmed/dismissed  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             4. Deterministic Mechanical Verification Engine            │
│                 src/lib/verifier.ts (Substring Locator)                 │
│       - Exact byte-level character offsets (quoteStartIndex / EndIndex) │
│       - Unicode quote & whitespace normalization                        │
│       - Rejects fabricated, paraphrased, or altered quotes             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               5. Immutable Source Snapshot & Invalidation               │
│                   src/lib/source-snapshot.ts                            │
│       - Freezes exact source text at time of analysis                   │
│       - Prevents divergence between live textarea edits and ledger     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              6. Human-in-the-Loop Review & Agreement Ledger            │
│                   src/components/AgreementLedger.tsx                    │
│       - Confirm (moves proposed/unclear into verified active scope)    │
│       - Dismiss (explicitly rules out scope item with audit trail)      │
│       - Filter by status, commitment type, or text search              │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│     7. Draft Clarification Notes   │ │   8. Persistence & Export         │
│     src/lib/reply-draft.ts        │ │   src/lib/project-storage.ts      │
│   - Grounded in cited quotes      │ │   - Multi-project localStorage    │
│   - Non-confrontational phrasing  │ │   - Audit-ready Markdown export   │
│   - Copy-to-clipboard action      │ │   - JSON execution traces         │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 3. Key Capabilities & Feature Highlights

### 1. Document Upload & Multi-Format Parsing
Directly ingest source contracts, client briefs, and statement-of-work documents without manual copy-pasting:
- **PDF Documents (`.pdf`):** Fast binary parsing powered by `unpdf`.
- **Word Documents (`.docx`, `.doc`):** Deep text and structure extraction via `mammoth`.
- **Markdown & Plain Text (`.md`, `.txt`):** Native UTF-8 stream processing.
- Drag-and-drop or file picker with client-side validation and size safeguards.

### 2. Dual-Layer Verification Guardrails
- **Semantic Layer (LLM):** Uses `nvidia/Nemotron-3_5-Lightning` on Nebius Token Factory for nuanced understanding of conversational speech acts (proposals, conditional acceptances, rejections).
- **Mechanical Grounding (Deterministic Code):** Completely bypasses model trust for quotation veracity. An independent string locator mathematically verifies that `quote` exists inside `sourceText`. Any altered, hallucinated, or ungrounded quote is flagged with failure diagnostics (`QUOTE_NOT_FOUND`, `MATERIAL_MISMATCH`, `EMPTY_QUOTE`).

### 3. Trust Boundaries & State Invariants
- **No Autonomous Modification:** The AI model is strictly prohibited from transitioning items into terminal statuses (`confirmed` or `dismissed`). Only a human operator can execute these actions.
- **Baseline Invariant:** Ordinary conversation or client emails cannot unilaterally declare themselves as `baseline` contract terms. Any model-suggested `baseline` candidate from informal correspondence is automatically downgraded to `proposed` with an explicit explanatory audit note.
- **Snapshot Freezing:** Extracted candidates are permanently linked to the immutable snapshot of the text analyzed, immune to subsequent textarea edits or accidental overwrites.

### 4. Interactive Agreement Ledger & Workspace
- **Bento Overview Dashboard:** High-level metrics showing confirmed items, pending scope drift, mechanical grounding percentage, and project summary.
- **Agreement Ledger:** Full-featured table with search, status filters, commitment type pills, verbatim quotation badges, and inline Confirm/Dismiss/Restore controls.
- **Evidence Inspector:** Side panel highlighting the exact character span of cited evidence in context with surrounding text.
- **One-Click Clarification Drafter:** Context-aware, polite email/Slack drafts addressing ambiguous or out-of-scope items, grounded directly in the cited evidence.

### 5. Multi-Project Management & Local Storage
- Create and switch between multiple client projects seamlessly.
- Pre-loaded with a realistic sample project: *"Aura Health Inc. — Mobile Patient Portal Redesign"*.
- All project data, custom ledger items, review decisions, and active threads are automatically persisted in browser `localStorage`.
- Full project reset and export to audit-ready Markdown.

---

## 4. Candidate Statuses & Commitment Types

### The Five Canonical Statuses
| Status | Meaning | Permitted Origin |
|---|---|---|
| `baseline` | Established core contract terms or signed SOW deliverables. | Project initialization / explicit contract upload |
| `proposed` | New deliverable or change requested but not yet approved. | Extracted from correspondence (or downgraded from baseline) |
| `unclear` | Ambiguous scope, conditional assent, or unstated pricing. | Extracted from correspondence |
| `confirmed` | Approved change with mutual assent and human confirmation. | **Human review only** |
| `dismissed` | Rejected, superseded, or out-of-scope item. | **Human review only** |

### The Four Commitment Types
1. **`deliverables`**: Specific work products, features, design components, or technical artifacts.
2. **`revision_limits`**: Constraints on review cycles, feedback windows, or iteration rounds.
3. **`deadlines`**: Delivery dates, sprint milestones, or schedule dependencies.
4. **`prices`**: Rates, fixed fees, change-order costs, milestone disbursements, or rush fees.

---

## 5. Technology Stack

- **Framework:** [Next.js 16.4.3](https://nextjs.org/) (App Router with Turbopack)
- **UI Library:** [React 19.3.0](https://react.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Typography:** Google Fonts via `next/font/google` ([Newsreader](https://fonts.google.com/specimen/Newsreader), [Geist Sans](https://vercel.com/font), [Geist Mono](https://vercel.com/font))
- **Schema Validation:** [Zod v4](https://zod.dev/)
- **Document Extractors:** [unpdf](https://github.com/unjs/unpdf) (PDFs), [mammoth](https://github.com/mwilliamson/mammoth.js) (DOCX/DOC)
- **Inference Engine:** [Nebius Token Factory](https://tokenfactory.nebius.com/) via official `openai` SDK (`nvidia/Nemotron-3_5-Lightning`)
- **Automated Testing:** Node.js native test runner (`node --test --experimental-strip-types`)

---

## 6. Project Structure Walkthrough

```
Receipts/
├── .env.example                     # Environment template for Nebius API keys
├── .env.local                       # Local secret configuration (git-ignored)
├── package.json                     # Dependencies, scripts, and runtime engines
├── next.config.ts                   # Next.js configuration (unpdf webpack alias & headers)
├── start.sh                         # Unix/macOS one-click interactive startup script
├── start.bat                        # Windows one-click interactive menu launcher
├── public/                          # Brand assets, logos, and favicons
│   ├── logo.png                     # Crisp high-contrast Receipts brand logo
│   └── Receipts_Verified.png        # Full-fidelity product brand badge
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout, Google Fonts (Newsreader/Geist), metadata
│   │   ├── globals.css              # Custom design system tokens, aurora effects, print styles
│   │   ├── page.tsx                 # Main workstation coordinator, tabs, and project state
│   │   └── api/
│   │       ├── extract/
│   │       │   └── route.ts         # POST /api/extract handler (Nebius extraction with guardrails)
│   │       └── parse-document/
│   │           └── route.ts         # POST /api/parse-document handler (PDF/DOCX/DOC/MD parsing)
│   ├── components/
│   │   ├── AgreementLedger.tsx      # Core table displaying commitments with review controls
│   │   ├── BentoOverview.tsx        # Bento-grid dashboard cards summarizing scope and grounding
│   │   ├── CustomTextVerifier.tsx   # Live input testbench (paste text or upload files)
│   │   ├── EvidenceInspector.tsx    # Slide-over verbatim quote inspector with span highlighter
│   │   ├── ExecutionTracePanel.tsx  # Verifier trace diagnostics and mechanical audit logs
│   │   ├── Header.tsx               # Workspace title, stats counter, and Markdown export actions
│   │   ├── InteractiveTourModal.tsx # Multi-step interactive guided onboarding tour
│   │   ├── LogoIntroOverlay.tsx     # Animated intro splash screen
│   │   ├── ProjectModal.tsx         # Create, switch, and delete local client projects
│   │   ├── QuickStartGuide.tsx      # Collapsible user quickstart tips and best practices
│   │   ├── ReplyDraftPanel.tsx      # Evidence-grounded client clarification drafter
│   │   ├── RequestReview.tsx        # Scope delta analysis between baseline and new proposals
│   │   ├── Sidebar.tsx              # Navigation sidebar with active project switcher
│   │   └── icons.tsx                # Lightweight, zero-dependency SVG icon system
│   └── lib/
│       ├── evaluate-extraction.ts   # Multi-dimensional benchmark scoring engine
│       ├── evaluation-cases.ts      # 17 realistic synthetic scope creep & injection test cases
│       ├── extraction-prompt.ts     # System instructions, schemas, and injection boundaries
│       ├── ledger-actions.ts        # Pure domain actions (confirm, dismiss, restore, add)
│       ├── nebius-extraction.ts     # Server-side OpenAI SDK client for Nebius Token Factory
│       ├── project-storage.ts       # Multi-project browser localStorage manager
│       ├── reply-draft.ts           # Pure template engine generating non-confrontational replies
│       ├── sample-data.ts           # Bundled realistic project data ("Aura Health Inc.")
│       ├── schema.ts                # Zod validation schemas for candidates and results
│       ├── source-resolver.ts       # Authoritative source locator linking items to origin text
│       ├── source-snapshot.ts       # Immutable source snapshot freeze and divergence guards
│       └── verifier.ts              # Deterministic byte-level substring matching engine
└── scripts/
    ├── run-live-eval.ts             # CLI harness benchmarking live model extractions
    └── nebius-smoke-test.mjs        # Direct API ping testing Nebius endpoint connectivity
```

---

## 7. Getting Started

### Prerequisites
- **Node.js**: v20.x or v22.x+ recommended (supported on Node.js 18+)
- **npm**: v10.x+

### Quick Start (Automated Scripts)

- **macOS / Linux:**
  ```bash
  chmod +x start.sh
  ./start.sh
  ```
- **Windows:**
  Double-click `start.bat` or run:
  ```cmd
  start.bat
  ```

### Manual Installation & Setup

1. **Clone and Install Dependencies:**
   ```bash
   git clone git@github.com:arjunpokhri/Receipts.git
   cd Receipts
   npm install
   ```

2. **Configure Environment Variables:**
   Copy the example environment template:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and configure your Nebius Token Factory credentials:
   ```env
   # Nebius Token Factory API Configuration
   NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1/
   NEBIUS_API_KEY=your_actual_nebius_api_key_here
   NEBIUS_MODEL=nvidia/Nemotron-3_5-Lightning
   ```
   *(Note: The application still runs and operates in manual verification & preview mode even without an API key).*

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 8. Testing & Quality Verification

Receipts features an extensive, 100% deterministic test suite containing **192 unit tests across 62 suites**:

```bash
# Run the complete test suite
npm test

# Run ESLint validation
npm run lint

# Build production application (Turbopack)
npm run build
```

### What the Test Suite Verifies:
- **Quote Verification:** Verbatim matches, Unicode curly quotes, line-break differences, and rejection of fabricated quotes.
- **Snapshot Freezing:** Invalidation of stale extractions and protection against live textarea mutations.
- **Domain State Machines:** Transition rules, baseline downgrades, and strict prohibition of auto-confirmations.
- **Document Parsing:** Text extraction from PDF, DOCX, DOC, Markdown, and TXT files.
- **Source Resolution:** Correct association between ledger items and original source text without silent fallbacks.

---

## 9. Benchmark Evaluation Harness

Receipts includes a standalone evaluation suite (`scripts/run-live-eval.ts`) to benchmark extraction performance against synthetic edge-case scenarios (`src/lib/evaluation-cases.ts`).

- **Preview Mode (0 API calls, completely safe):**
  ```bash
  npm run eval:live
  ```
- **Live Evaluation (Dispatches live calls to Nebius):**
  ```bash
  npm run eval:live -- --yes
  ```
- **Target a Specific Scenario:**
  ```bash
  npm run eval:live -- --yes --runs 1 --only case-01-clear-baseline-scope
  ```

---

## 10. Documentation Directory

For in-depth architectural specifications and design records:
- [SPEC.md](./SPEC.md) — Comprehensive product specifications, trust boundaries, and status definitions.
- [DESIGN.md](./DESIGN.md) — Complete visual design system, token definitions, typography, and component guide.
- [STATUS.md](./STATUS.md) — Phased implementation log, test inventory, and capability breakdown.
- [DECISIONS.md](./DECISIONS.md) — Architecture Decision Records (ADRs) and technical rationales.
- [LICENSE](./LICENSE) — Project licensing terms and conditions.
