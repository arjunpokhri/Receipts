# Receipts Specification

## 1. Overview & Problem Definition

### Target Users
- Freelance independent contractors (designers, software engineers, copywriters, consultants).
- Small creative and technical client service agencies (teams of 2–10).

### The Problem We Solve
Freelancers and small agency operators regularly face scope creep, unbilled deliverables, disputed revision rounds, and forgotten side conversations. Agreements and commitments occur across informal channels (Slack, email, chat transcripts, meeting recaps), but critical scope details get lost or contested when milestones are reached.

Existing project management tools track tickets, not agreements. Legal contract software handles signed master services agreements, but fails to capture ongoing conversational commitments, scope amendments, or informal approval threads.

Receipts provides an **evidence-backed agreement and scope tracker**. It extracts commitments directly from raw client communication, links every claim to verified verbatim evidence, drafts professional clarification messages, and updates the canonical agreement ledger **only upon explicit human confirmation**.

---

## 2. Core Workflow

1. **Input Evidence:** User pastes or imports raw client communication (email thread, chat log, transcript).
2. **Evidence Extraction & Scope Checking:** The system identifies candidate agreements, maps each candidate directly to verbatim quotes, and classifies scope implications.
3. **Evidence Verification:** Every extracted candidate is checked against the raw source text to guarantee accurate quoting before presentation.
4. **Clarification Drafting:** The system drafts a concise, professional message for any unconfirmed, proposed, or ambiguous items.
5. **Human Confirmation & Ledger Update:** The canonical agreement ledger is updated **only after explicit human review and approval**.

---

## 3. Five Candidate Statuses

Every extracted commitment or agreement candidate must strictly conform to one of five mutually exclusive statuses:

1. **`baseline`**: An existing, previously established commitment from the original contract or initial scope document.
2. **`proposed`**: A change or addition requested or suggested by either party that has not yet been mutually approved.
3. **`confirmed`**: An agreement that has received clear mutual assent with verified documentary evidence.
4. **`unclear`**: A statement or discussion point with ambiguous scope, unstated terms, or undetermined expectations that requires clarification before commitment.
5. **`dismissed`**: A candidate rejected, superseded, or explicitly ruled out by the human operator.

---

## 4. Four Commitment Types

To keep tracking structured and concrete, every candidate is categorized under one of four commitment types:

1. **`deliverables`**: Specific work products, features, assets, or artifacts to be designed, coded, or shipped.
2. **`revision_limits`**: Constraints on review cycles, iteration rounds, rework thresholds, or modification windows.
3. **`deadlines`**: Dates, milestones, delivery timelines, or schedule dependencies.
4. **`prices`**: Fees, hourly rates, milestone billing triggers, deposit terms, or additional change-order charges.

---

## 5. Core MVP Capabilities

- **Evidence-Backed Extraction:** Identifies commitments along with exact source snippets, timestamps, or speaker attribution.
- **Scope Checking:** Flags differences between baseline commitments and proposed/unconfirmed requests.
- **Evidence Verification:** Validates that extracted quotes strictly match substrings in the source communication.
- **Confirmation Drafting:** Generates client-facing clarification notes and confirmation request messages.
- **Markdown Export:** Exports the canonical agreement ledger and verified audit trails into clean, human-readable Markdown format.

---

## 6. Explicit Non-Goals

To maintain strict operational focus, defensibility, and reliability, Receipts explicitly excludes:

- **No Authentication:** No user accounts, passwords, JWTs, or session management in the local/MVP version.
- **No Database:** No external persistence services, SQL/NoSQL databases, or remote schemas; operates in-session / file-based.
- **No PDF / OCR Parsing:** No binary document parsing, layout extraction, or optical character recognition; consumes UTF-8 text.
- **No External Integrations:** No direct OAuth sync with Slack, Gmail, Asana, Jira, or CRM platforms.
- **No Payments / Invoicing:** No Stripe, banking connections, billing engines, or payment processing.
- **No Automatic Agreement Updates:** The system will **never** alter the agreement ledger autonomously without explicit human approval.
- **No Legal Conclusions:** Receipts is an administrative alignment and scope tracking tool; it does not provide legal advice or legal enforceability judgments.

---

## 7. Success Metrics & Fallback Strategy

### Success Metrics
- **Extraction Precision:** Zero hallucinated quotes (100% of cited evidence quotes must exist verbatim in the source communication).
- **Status Classification Accuracy:** Accurate delineation between confirmed terms and unconfirmed/proposed changes (>90% benchmark agreement).
- **User Agency:** 100% of ledger modifications require human confirmation.

### Baseline-Only Fallback
If model evaluation fails, the API is unreachable, or extraction confidence falls below acceptable thresholds:
- The system gracefully degrades to a **manual baseline-only mode**.
- Users can manually paste evidence, specify status and commitment type, review ledger entries, and export Markdown records without automated model inference.
