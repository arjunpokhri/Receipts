## Inspiration

Every freelancer, indie developer, and boutique agency owner knows the dread of "just one quick change." A project kicks off with an agreed scope, but over weeks of communication, informal commitments scatter across fragmented channels: a 2 AM Slack message, an offhand agreement in an email chain, a verbal recap, or an ambiguous 15-page statement-of-work PDF. 

When final invoice day arrives, the contractor remembers a billable change-order, while the client remembers an included favor. This leads to awkward disputes, delayed payments, and eroded profit margins. 

Traditional contract tools are too rigid for fast-moving daily chats, while generic AI chatbots are probabilistic black boxes prone to hallucinations. We built **Receipts** to bring mathematical certainty and zero-trust verification to client communication, turning messy correspondence into an immutable, evidence-backed agreement ledger.

## What it does

Receipts allows freelancers and agencies to paste communication logs or upload document files (PDFs, Word docs, Markdown, text files) and instantly:

1. **Extracts Commitments:** Automatically identifies deliverables, pricing rates, deadlines, and revision limits.
2. **Grounds Evidence Mechanically:** Mathematically verifies that every cited quote exists verbatim in the source document. Hallucinated or paraphrased quotes are rejected.
3. **Flags Scope Drift & Ambiguity:** Distinguishes baseline contract obligations from unapproved additions, conditional approvals, and rate conflicts.
4. **Drafts Client-Ready Replies:** Generates polite, non-confrontational clarification emails in one click, citing the client's verbatim words and contract clauses.
5. **Maintains Audit Ledgers:** Provides an interactive ledger with human review controls (Confirm, Dismiss, Restore), persisted locally and exportable to clean Markdown.

## How we built it

We built Receipts around a **zero-trust grounding architecture**, decoupling probabilistic generative AI from deterministic verification:

- **Ingestion & Text Normalization:** Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS. The backend ingests multi-format documents (PDF via `unpdf`, Word via `mammoth`, and UTF-8 text streams), normalizing Unicode characters and whitespace \((\text{CRLF} \to \text{LF})\) while preserving original byte offsets.
- **Semantic Inference with NVIDIA Nemotron & Nebius:** We integrated **NVIDIA Nemotron-3.5-Lightning** (`nvidia/Nemotron-3_5-Lightning`) running on **Nebius Token Factory** to perform structured JSON extraction. The model categorizes commitments into 4 concrete domains:

$$
\mathcal{C} \in \{\text{deliverables}, \text{prices}, \text{deadlines}, \text{revision\_limits}\}
$$

and classifies communicative intent across 7 pragmatic speech acts:

$$
\mathcal{A} \in \{\text{request}, \text{proposal}, \text{question}, \text{acceptance}, \text{rejection}, \text{commitment}, \text{information}\}
$$

- **Reasoning Token Optimization:** To avoid token exhaustion and JSON truncation from unbounded chain-of-thought loops, we tuned inference with:
```typescript
chat_template_kwargs: { enable_thinking: false }
```
At deterministic temperature \(\tau = 0\) with `response_format: { type: "json_object" }`, Nemotron delivers ultra-low latency (\(p_{50} < 1.6\text{s}\)) with 100% token allocation dedicated to clean, structured data extraction.
- **Untrusted Boundary Guardrails:** Raw client text is strictly encapsulated inside `<<<UNTRUSTED_COMMUNICATION_SOURCE>>>` boundary tags. Nemotron is instructed to treat the payload strictly as inert data, making prompt injection or jailbreak attempts completely harmless.
- **Deterministic Substring Verifier:** We don't trust LLM quotes blindly. Every candidate must satisfy:

$$
\text{Verify}(S, q) = \begin{cases} \text{True}, & \exists \, [i, j] \text{ s.t. } \text{norm}(S[i:j]) = \text{norm}(q) \\ \text{False}, & \text{otherwise} \end{cases}
$$

If a quote cannot be verified verbatim at exact character offsets \([i, j]\), the candidate is flagged and blocked from entering the active ledger.
- **Immutable Snapshot Freezing:** When extraction runs, the source text is snapshotted into an immutable session. If the user modifies the input box, the system detects divergence and prevents corrupted character spans.

## Challenges we faced

- **The Verbatim Quote Mismatch Problem:** Real-world emails and documents contain curly quotes (`“` / `”`), non-breaking spaces, and soft line breaks. Initial tests showed valid quotes failing matching checks. We engineered a normalization layer that standardizes typography variants without altering the underlying character indices.
- **Eliminating Reasoning Token Bloat:** High-parameter reasoning models often produce lengthy internal thinking traces before outputting JSON, which risked exhausting the completion budget on long email threads. Configuring backend template arguments to suppress unnecessary thinking traces gave us fast, deterministic outputs.
- **Preventing AI Overreach:** AI models tend to be overly agreeable and classify informal promises as binding contracts. We enforced rigid trust boundaries: the model can only suggest `baseline`, `proposed`, or `unclear` statuses, and any suggested baseline from informal correspondence is automatically downgraded to `proposed`. Terminal confirmation (`confirmed` or `dismissed`) is strictly restricted to human review.

## Accomplishments that we're proud of

- **Near-Zero Hallucination Rate:** Through our dual-layer combination of NVIDIA Nemotron-3.5-Lightning and our deterministic verifier, 100% of the quotes appearing in the active agreement ledger are physically grounded in source text.
- **Rigorously Benchmarked:** Created an offline-and-live evaluation CLI (`scripts/run-live-eval.ts`) with 17 realistic edge-case scenarios (unauthorized sign-offs, price disputes, prompt injections) evaluated over \(N = 51\) live trials. We mathematically quantified run-to-run status instability:

$$
\Delta_{\text{instability}} = \frac{1}{|\mathcal{C}|} \sum_{c \in \mathcal{C}} \mathbb{I}(s_1(c) \neq s_2(c))
$$

Nemotron scored near-zero drift across repeated evaluations.
- **Comprehensive Test Suite:** Authored 192 automated unit tests across 62 suites passing with 100% reproducibility.
- **Local-First Privacy:** All client agreement ledgers and transcripts persist in browser `localStorage`. No client communications or confidential contract sums are stored on external databases.

## What we learned

- **Deterministic Verification Beats Blind Trust:** Large Language Models excel at semantic classification and unstructured understanding, but they should never be the final arbiters of legal and financial truth. Coupling NVIDIA Nemotron's linguistic intelligence with mathematical string verification produces a reliable, audit-grade developer tool.
- **Human Agency is Essential:** AI should accelerate review, not make autonomous business commitments. Keeping the human in the loop preserves trust and professional relationships.

## What's next for Receipts

- **Persistent Multi-Project Workspaces:** Dedicated client workspaces where freelancers can continually append new emails and addendums across multi-month client engagements.
- **Live Communication Integrations:** Webhook and OAuth connectors for Gmail, Slack channels, and Discord.
- **Visual Agreement Timelines:** Interactive chronological timelines mapping scope modifications directly against project milestones.
- **One-Click Invoicing Export:** Direct sync of verified scope addendums into Stripe, QuickBooks, and FreshBooks invoices.
