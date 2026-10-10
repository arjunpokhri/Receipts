# Receipts Design & Visual Specification

## 1. Visual Direction & Aesthetic Principles

- **Polished, Professional, and Restrained:** Clean, utility-first user interface tailored for administrative precision and professional accountability.
- **No Generic AI-Chat Tropes:** Strictly avoid conversational chat bubbles, floating bot avatars, typing animations, or chat-centric layouts. Receipts is an audit ledger and workstation, not a chatbot.
- **Subdued Color Palette:** High contrast, neutral foundations (zinc/slate) with intentional, restrained functional accents.
- **Zero Gratuitous Motion:** Avoid unnecessary transitions, bouncing elements, or complex gradient flourishes.

---

## 2. Planned Workspace Layout

The application will center around a structured 5-panel layout designed for high information density and evidence traceability:

```
+---------------------------------------------------------------------------------------+
| Receipts — Evidence-Backed Agreement Tracker                                         |
+---------------------------------------------------------------------------------------+
| [Panel 1: Evidence-Verification Workspace] | [Panel 2: Agreement Ledger]             |
| - Raw source text input                    | - Baseline commitments                  |
| - Verbatim substring matching              | - Confirmed commitments                 |
| - Highlighted verification markers         | - Scope type badges & filters           |
+--------------------------------------------+-----------------------------------------+
| [Panel 3: Request-Analysis Panel]          | [Panel 4: Reply-Draft Panel]            |
| - Scope drift & Delta analysis             | - Prepared clarification wording        |
| - Proposed changes & Unclear terms         | - Copy-to-clipboard action              |
| - Evidence attribution cards               | - Contextual justification              |
+--------------------------------------------+-----------------------------------------+
| [Panel 5: Execution-Trace Panel]                                                      |
| - Model invocation metadata (latency, tokens, schema validation)                      |
| - Evidence grounding score & audit logs                                               |
+---------------------------------------------------------------------------------------+
```

### Detailed Panel Breakdown:
1. **Evidence-Verification Workspace:** Accepts raw text snippets (threads, emails), shows source attribution, and verifies that candidate quotes match verbatim substrings in the original input.
2. **Agreement Ledger:** Tabular or dense list view of the active state of record, categorized by status (`baseline`, `confirmed`) and type (`deliverables`, `revision_limits`, `deadlines`, `prices`).
3. **Request-Analysis Panel:** Surfaces new findings (`proposed`, `unclear`, `dismissed`), explaining why an item is categorized as scope creep or requires clarification.
4. **Reply-Draft Panel:** Generates concise, professional, non-confrontational communication snippets ready for the freelancer or agency lead to send to the client.
5. **Execution-Trace Panel:** Provides transparent observability into model calls, schema validation checks, timestamping, and parsing fidelity.

---

## 3. Evidence Status States & Semantic Design

Evidence grounding must be immediately obvious and visually unambiguous:

| Status | Semantic Indicator | Visual Treatment | Description |
|---|---|---|---|
| **Verified Evidence** | Emerald / Green | `border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200` | Exact verbatim substring match confirmed between extracted quote and source communication. |
| **Failed Evidence** | Rose / Red | `border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/30 dark:text-rose-200` | Extracted quote could not be located in source text (flagged as unverified/hallucination risk). |
| **Ambiguous Evidence** | Amber / Orange | `border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200` | Partial match, fuzzy phrasing, or missing speaker/timestamp attribution. |

---

## 4. Typography and Spacing

- **Base Font:** Inter or system sans-serif (`font-sans`) for primary UI controls and labels.
- **Monospace Font:** JetBrains Mono or system mono (`font-mono`) for quotes, evidence strings, timestamps, and schema traces.
- **Information Density:** Compact padding (`p-3`, `gap-2`, `text-xs`/`text-sm`) to maximize visible context without overwhelming the operator.
