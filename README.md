# Receipts

**Evidence-backed agreement and scope tracker for freelancers and boutique agencies.**

Receipts turns messy, unstructured client communication—Slack messages, emails, WhatsApp threads, and meeting transcripts—into a structured, verified agreement ledger. Every extracted commitment is anchored directly to verbatim source text with mechanical character-span verification, stopping scope drift and contract misunderstandings before they turn into unpaid work.

---

## 1. The Problem

Freelancers and digital agencies lose thousands of dollars to subtle scope creep:
- A client offhandedly asks: *"Could we also add a 3D product viewer module right below the hero section?"*
- An intern replies: *"Go ahead and start on that, looks good to me!"* without commercial sign-off authority.
- A stakeholder says: *"I need to run the $600 by finance first,"* leaving price assent ambiguous.

Without a centralized, evidence-backed record, teams either deliver out-of-scope work for free or face awkward, relationship-damaging disputes when invoicing. Receipts solves this with an audit-ready, human-in-the-loop workflow.

---

## 2. Core Workflow

```
Raw Communication ──▶ Nebius Token Factory ──▶ Substring Grounding ──▶ Agreement Ledger ──▶ Draft Clarification
 (Slack/Email/Text)     (Nemotron-3_5-Lightning)    (Mechanical Match)        (Human Review)        (Client-Ready)
```

1. **Ingest & Extract:** Paste unstructured communication (up to 30,000 characters) or select an industry scenario preset. Nebius Token Factory analyzes the text and extracts structured commitment candidates.
2. **Mechanical Quote Grounding:** Every candidate quote is checked by a deterministic substring verifier against the verbatim source text. If a quote is fabricated, altered, or ungrounded, it is mechanically flagged and rejected.
3. **Human-in-the-Loop Review:** The user inspects the evidence, reviews the speech act and confidence, and decides whether to **Confirm** the item into the active scope, **Dismiss** it as out-of-scope, or mark it for follow-up. The model is strictly prohibited from setting terminal statuses (`confirmed` or `dismissed`).
4. **Draft Clarifications:** Turn unconfirmed or ambiguous scope items into polite, non-confrontational client messages with one click.
5. **Persistent Workspace:** User decisions, custom ledger entries, and status changes are automatically persisted to browser `localStorage` and restored on page refresh without losing evidence links.

---

## 3. Architecture & Key Features

### Dual-Layer Verification Architecture
1. **Semantic Inference Layer:** Powered by Nebius Token Factory running `nvidia/Nemotron-3_5-Lightning`. The model extracts commitments into 4 types (`deliverables`, `revision_limits`, `deadlines`, `prices`), 7 speech acts (`request`, `proposal`, `question`, `acceptance`, `rejection`, `commitment`, `information`), and 3 initial statuses (`baseline`, `proposed`, `unclear`).
2. **Deterministic Mechanical Layer:** A standalone TypeScript verification engine (`src/lib/verifier.ts`) locates exact byte-level character offsets (`quoteStartIndex`, `quoteEndIndex`) in the source text. No hallucinated or misquoted evidence can enter the verified ledger.

### Safety & Guardrails
- **Untrusted Source Tagging:** Untrusted client text is strictly delimited within `<<<UNTRUSTED_COMMUNICATION_SOURCE>>>` boundary tags to prevent prompt injection.
- **Thinking Token Protection:** Leverages `chat_template_kwargs: { enable_thinking: false }` and strict prompts to prevent unbounded reasoning token exhaustion.
- **Server-Side Credentials:** All Nebius Token Factory interactions happen inside Next.js server route handlers (`POST /api/extract`). API keys and endpoints are never exposed to client browsers.
- **Hard Request Limits:** Source text capped at 30,000 characters; completion capped at 4,096 tokens; 45-second bounded timeouts.

---

## 4. Current Implementation Status

| Feature / Area | Status | Verified Capabilities |
|---|---|---|
| **Multi-Panel Workspace** | **Verified** | Agreement Ledger, Evidence Inspector, Conversation Extractor, Bento Overview, and Clarification Drafter. |
| **Nebius API Integration** | **Verified** | Server-side extraction with `nvidia/Nemotron-3_5-Lightning` via OpenAI SDK. |
| **Deterministic Grounding** | **Verified** | Character-span substring locator verifying verbatim quote existence. |
| **Interactive Ledger Review** | **Verified** | Human Confirm, Dismiss, and Restore controls with status counts. |
| **Workspace Persistence** | **Verified** | `localStorage` persistence of user entries and review actions across page reloads. |
| **Unit Test Suite** | **Verified** | 189 unit tests covering verification, schema parsing, evaluation, and storage. |
| **Multi-Project Cloud Sync** | Planned | Roadmap feature for multi-user team workspaces with cloud databases. |
| **Direct Integrations** | Planned | Roadmap feature for Slack/Gmail/WhatsApp webhooks. |
| **Contract PDF / SOW Export** | Planned | Roadmap feature for portable contract generation and diffing. |

---

## 5. Technology Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) (Editorial aesthetic, warm paper canvas `#FCFAF7`, deep forest green `#244D3A`)
- **Validation:** [Zod v4](https://zod.dev/)
- **Inference Engine:** [Nebius Token Factory](https://tokenfactory.nebius.com/) (`nvidia/Nemotron-3_5-Lightning`)
- **Testing:** Node.js native test runner (`node --test`)

---

## 6. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 20+ and 24+)
- npm 9+ (tested on npm 10+ and 11+)

### Installation
Clone the repository and install dependencies:
```bash
# macOS / Linux
npm install

# Windows (Command Prompt / PowerShell)
npm.cmd install
```

### Environment Configuration
1. Create a `.env.local` file by copying `.env.example`:
```bash
# macOS / Linux
cp .env.example .env.local

# Windows (Command Prompt / PowerShell)
copy .env.example .env.local
```

2. Add your Nebius Token Factory API key to `.env.local`:
```env
# Nebius Token Factory API Configuration
NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1/
NEBIUS_API_KEY=your_actual_nebius_api_key_here
NEBIUS_MODEL=nvidia/Nemotron-3_5-Lightning
```

> **Security Note:** Never commit `.env.local` or share your actual API keys. `.env.local` and evaluation outputs are excluded from Git in `.gitignore`.

### Development Server
Start the local Next.js development server:
```bash
# macOS / Linux
npm run dev

# Windows
npm.cmd run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Quality Checks & Testing

The project includes an extensive automated test suite with 189 unit tests:

```bash
# Run unit tests
npm test
# Windows:
npm.cmd test

# Run ESLint
npm run lint
# Windows:
npm.cmd run lint

# Production build
npm run build
# Windows:
npm.cmd run build
```

---

## 8. Benchmark Evaluation Harness

Receipts includes a standalone evaluation suite (`scripts/run-live-eval.ts`) to benchmark extraction performance against synthetic edge-case scenarios (`src/lib/evaluation-cases.ts`).

- **Dry-run / Preview (0 API calls, safe):**
  ```bash
  npm run eval:live
  ```
- **Live evaluation (requires active `NEBIUS_API_KEY`):**
  ```bash
  npm run eval:live -- --yes
  ```
- **Target a specific scenario:**
  ```bash
  npm run eval:live -- --yes --runs 1 --only case-01-clear-baseline-scope
  ```

---

## 9. Project Documentation

Detailed architecture specifications and decision logs:
- [SPEC.md](./SPEC.md) — Product specifications, status definitions, commitment types, and fallbacks.
- [DESIGN.md](./DESIGN.md) — Visual design system, palette, typography, and layout specifications.
- [DECISIONS.md](./DECISIONS.md) — Architectural decision log and model selection rationales.
- [STATUS.md](./STATUS.md) — Detailed implementation progress and phase completion notes.

---

## 10. License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
