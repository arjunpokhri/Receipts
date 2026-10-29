# Receipts Product Specification

## 1. Overview & Problem Definition

### Target Users
- **Freelance Knowledge Workers:** Software engineers, UI/UX designers, copywriters, creative consultants, and marketing strategists.
- **Boutique Agencies:** Client-service studios and consulting firms (teams of 1–15) handling concurrent client agreements and evolving deliverables.

### The Problem
Client service agreements evolve organically across informal communication channels:
- Slack direct messages and shared channels
- Email chains and reply threads
- WhatsApp, Telegram, or text messaging
- Verbal phone calls summarized in informal follow-up notes
- Initial proposal and Statement of Work (SOW) documents

Critical scope boundaries, revision limitations, rates, and deadline shifts are easily blurred. When invoicing or project closeout arrives, freelancers often face two painful choices: **eat the cost** of unpaid scope creep or **enter confrontational disputes** that damage valuable client relationships.

### The Receipts Solution
Receipts is an **evidence-backed agreement and scope tracker**. It ingests raw client communications or uploaded documents, extracts concrete commitments, mechanically grounds every claim to verbatim character spans in the source text, drafts courteous clarification messages, and updates the canonical agreement ledger **strictly upon human confirmation**.

---

## 2. End-to-End System Workflow

```
1. Ingest Evidence ──▶ 2. Parse & Extract ──▶ 3. Verify Quotes ──▶ 4. Human Review ──▶ 5. Ledger & Drafts
(Text or Upload)       (Nebius LLM)           (Exact Spans)        (Confirm/Dismiss)   (Active Scope / Clarifications)
```

1. **Ingest Evidence:** User pastes conversation text or uploads a document file (PDF, DOCX, DOC, MD, TXT).
2. **Text Normalization & Parsing:** Binary files are converted to UTF-8 text via `unpdf` and `mammoth`; plain text and markdown are streamed natively.
3. **Commitment Extraction:** The semantic inference layer (`nvidia/Nemotron-3_5-Lightning` via Nebius Token Factory) analyzes the source text and proposes structured candidate commitments.
4. **Mechanical Grounding:** The deterministic substring verifier searches the exact verbatim source text for cited quotes, calculating byte-level start and end character offsets. Fabricated, altered, or ungrounded quotes are mechanically rejected.
5. **Snapshot Freezing:** The source text analyzed is snapshotted to guarantee immutable audit trails, preventing desynchronization if the user modifies the input box.
6. **Human-in-the-Loop Review:** The user inspects the extracted candidates, reviewing speech acts, confidence, and context. The operator clicks **Confirm** (to move an item into active scope), **Dismiss** (to rule it out), or leaves it pending.
7. **Clarification Drafting:** For unconfirmed, proposed, or ambiguous items, Receipts synthesizes a polite, non-confrontational message citing the exact quote and clarifying the commercial impact.
8. **Persistence & Export:** The active ledger, project settings, and audit logs are saved locally in browser `localStorage` and can be exported as clean, shareable Markdown.

---

## 3. The Five Canonical Statuses

Every agreement item in the canonical ledger conforms strictly to one of five mutually exclusive statuses:

| Status | Definition | Transition Rules | Permitted Roles |
|---|---|---|---|
| **`baseline`** | Contractually established scope or agreed deliverables from the original signed agreement. | Initialized at project creation or imported from official contract documents. | Human / Project Setup |
| **`proposed`** | A scope change, new feature, or deadline shift requested or suggested by either party, not yet approved. | Model-suggested during extraction, or downgraded from suggested baseline. | Model Extraction / Human Downgrade |
| **`unclear`** | Ambiguous discussion point, conditional acceptance, unpriced request, or unresolved specification. | Model-suggested during extraction when evidence is incomplete or vague. | Model Extraction |
| **`confirmed`** | An agreement or scope change that has received mutual assent, verified documentary evidence, and human review. | Transitioned from `proposed` or `unclear` only. Cannot be undone without restoring. | **Human Reviewer Only** |
| **`dismissed`** | A request or discussion item explicitly rejected, superseded, or ruled out of scope. | Transitioned from `proposed` or `unclear`. Can be restored back to review. | **Human Reviewer Only** |

### Critical Status Invariants:
1. **Model Prohibition:** The AI model is strictly prohibited from returning `confirmed` or `dismissed`. Any model output attempting to set terminal statuses is rejected by Zod schema validation.
2. **Baseline Protection:** Informal client correspondence (emails, chat logs) cannot unilaterally declare itself as `baseline`. Any model-suggested `baseline` candidate originating from informal communication is automatically downgraded to `proposed` with an explanatory audit note.

---

## 4. The Four Commitment Types

1. **`deliverables`**: Specific tangible or digital assets, features, modules, design screens, integrations, or technical artifacts.
   - *Example:* "Implement responsive tablet breakpoints for patient dashboard."
2. **`revision_limits`**: Constraints on iteration rounds, review cycles, feedback windows, or modification thresholds.
   - *Example:* "Includes up to 2 rounds of design revisions; additional rounds billed hourly."
3. **`deadlines`**: Dates, milestones, delivery schedules, sprint sprints, or delivery timelines.
   - *Example:* "Final QA handoff scheduled for Friday, November 14th at 5:00 PM EST."
4. **`prices`**: Fees, hourly rates, fixed milestone sums, deposit requirements, change-order rates, or rush charges.
   - *Example:* "Additional feature modules billed at $140/hour with prior written approval."

---

## 5. The Seven Speech Acts

To ensure granular understanding of client communication, each candidate is classified under one of seven linguistic speech acts:

1. **`request`**: Client asks for new work or an alteration (*"Could we also add dark mode support?"*).
2. **`proposal`**: Freelancer or client suggests an approach or term (*"We recommend capping phase 1 at 3 core screens"*).
3. **`question`**: Inquiry without commitment (*"How much would it cost to integrate Stripe instead of PayPal?"*).
4. **`acceptance`**: Clear mutual agreement (*"Yes, the $1,200 change order works for us. Approved."*).
5. **`rejection`**: Explicit refusal (*"No, let's skip the video intro for now to save budget."*).
6. **`commitment`**: Explicit promise of action or delivery (*"I will deliver the completed SVG icons by Tuesday noon"*).
7. **`information`**: Contextual statement without direct scope implication (*"Our marketing director will be out of office next week"*).

---

## 6. Document Ingestion Specification

Receipts supports multi-format document ingestion via `POST /api/parse-document`:

### Supported Formats & Extraction Engines:
- **Portable Document Format (`.pdf`):** Parsed using `unpdf`, extracting text content, page boundaries, and document metadata without heavy native C++ binaries.
- **Microsoft Word (`.docx`, `.doc`):** Parsed using `mammoth`, converting paragraphs, lists, and tables into structured clean plain text.
- **Markdown (`.md`, `.markdown`):** Native stream parsing preserving heading structure and list formatting.
- **Plain Text (`.txt`):** Fast direct UTF-8 buffer decoding.

### Limits & Safeguards:
- **Maximum File Size:** 10 MB per upload.
- **Maximum Text Extraction:** 100,000 characters (truncated with warning if exceeded to prevent memory exhaustion).
- **Client-Side Mime Validation:** File extension and MIME type checked before transmission.

---

## 7. Deterministic Verification & Trust Architecture

### Substring Matching Engine (`src/lib/verifier.ts`):
- Searches `sourceText` for `evidenceQuote`.
- Normalizes Unicode quotation marks (e.g. `“`, `”`, `‘`, `’` converted to standard ASCII `"` and `'`).
- Collapses multi-character whitespace, tabs, and line-breaks for comparison while recording exact byte offsets in the original raw text.
- Returns `quoteStartIndex` and `quoteEndIndex`.

### Failure Reasons:
- `EMPTY_QUOTE`: Extracted quote string is empty or whitespace only.
- `EMPTY_SOURCE`: Source document is empty.
- `QUOTE_NOT_FOUND`: Cited quote does not appear anywhere in the source document.
- `MATERIAL_MISMATCH`: Quote is paraphrased or contains altered words/numbers.

---

## 8. Multi-Project Architecture & Persistence

Receipts operates client-first for maximum privacy, speed, and zero cloud hosting liabilities:
- **Project Schema:** Projects have an `id`, `name`, `client`, `contractor`, `ledgerItems`, `threads`, `createdAt`, and `updatedAt`.
- **Default Sample Project:** Pre-loaded with *"Aura Health Inc. — Mobile Patient Portal Redesign"* containing 8 realistic baseline and scope creep items across multiple communication threads.
- **Browser LocalStorage:** Projects, review state, active filters, and custom items persist automatically across page refreshes.
- **Markdown Export:** Instant download or copy-to-clipboard of the verified agreement ledger, organized by status and verified evidence quotes.

---

## 9. Explicit Non-Goals & Boundaries

To preserve strict operational reliability, legal clarity, and focused UX:
- **No Optical Character Recognition (OCR):** Receipts does not perform image OCR on scanned raster image PDFs or photos of paper contracts. It parses digital text layers.
- **No Autonomous Ledger Mutations:** The system **never** marks an item as `confirmed` or `dismissed` without an explicit human click.
- **No Legal Conclusions:** Receipts provides administrative and commercial clarity; it does not provide legal advice, legal counsel, or court-enforceability determinations.
- **No Cloud Database / Remote Secret Sync:** All project data remains strictly inside the user's browser storage. API calls to Nebius Token Factory are transient, stateless, and do not persist user text to external databases.
- **No Unsolicited Automated Outbound Messages:** Draft clarification emails are created for the user to review, edit, and send through their own email/Slack clients; Receipts never auto-dispatches messages to clients.
