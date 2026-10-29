# Receipts Architectural Decisions & Open Questions

## 1. Architectural Decision Records (ADRs)

### ADR 001: Next.js App Router with TypeScript & Tailwind CSS
- **Decision:** Build the workstation using Next.js 16 (App Router), TypeScript 5, and Tailwind CSS 4 with Turbopack.
- **Rationale:** Delivers type-safe fullstack React capabilities, server route handlers (`POST /api/extract`, `POST /api/parse-document`) that protect API secrets from browser exposure, and fast compile times with Turbopack.
- **Trade-off:** Strict SSR hydration rules and file layout constraints, managed cleanly by keeping client components focused on interactive UI and domain state.

---

### ADR 002: Minimal External Dependencies
- **Decision:** Strictly avoid sprawling monolithic component libraries (MUI, AntD, Chakra) or heavy ORMs. Rely on native React 19, Tailwind CSS utility classes, `openai` (for Nebius Token Factory compatibility), and `zod` for strict runtime schema validation.
- **Rationale:** Ensures maximum load speed, minimal attack surface, zero dependency conflicts, and zero build bloat.
- **Trade-off:** UI components (modals, sliders, badges, tables) are authored natively within `src/components/`, which grants full custom control over the editorial aesthetic.

---

### ADR 003: Dual-Layer Deterministic Evidence Verification
- **Decision:** Decouple semantic LLM extraction from quote authenticity verification. Every quote extracted by the model must be confirmed by an independent string search algorithm (`src/lib/verifier.ts`) directly in the source text.
- **Rationale:** Large Language Models are prone to subtle hallucinations, paraphrasing, and quote alterations. For legal and commercial agreement tracking, fabricated quotes are catastrophic.
- **Trade-off:** Requires robust normalization for Unicode curly quotes, line breaks, and multi-space formatting without allowing word substitutions.

---

### ADR 004: Local-First Multi-Project Persistence
- **Decision:** Persist project ledgers, review statuses, and custom items in browser `localStorage` (`src/lib/project-storage.ts`), rather than requiring an external cloud SQL database or user authentication.
- **Rationale:**
  1. Client communication often contains highly confidential trade secrets, billing rates, and NDAs. Storing text locally prevents data leaks and cloud liability.
  2. Zero server maintenance costs and instant, zero-latency state loads.
  3. Works completely offline for reviewing existing project ledgers.
- **Trade-off:** Data is tied to the user's browser profile. Mitigated by one-click Markdown ledger export and JSON backup capabilities.

---

### ADR 005: Nebius Token Factory & Nemotron-3.5-Lightning Model Selection
- **Decision:** Utilize Nebius Token Factory running `nvidia/Nemotron-3_5-Lightning` via OpenAI-compatible endpoints.
- **Rationale:**
  1. High instruction adherence and strict JSON output formatting via `response_format: { type: "json_object" }`.
  2. Excellent linguistic comprehension for subtle speech acts (conditional assent, ambiguous scopes, soft rejections).
  3. Bounded token efficiency: configured with `chat_template_kwargs: { enable_thinking: false }` to prevent unbounded reasoning token loops from exhausting completion budgets.
- **Trade-off:** Requires a valid `NEBIUS_API_KEY` for live extraction. Addressed by offering manual fallback entry and bundled sample project data when running offline.

---

### ADR 006: Immutable Source Snapshot Freezing
- **Decision:** Capture an immutable snapshot (`src/lib/source-snapshot.ts`) of the source text at the exact moment the extraction API is dispatched.
- **Rationale:** If a user edits or deletes text in the input textarea while reviewing previously extracted candidates, the character offsets (`quoteStartIndex`, `quoteEndIndex`) would point to corrupted positions. Freezing the snapshot and detecting divergence ensures every candidate remains grounded in the exact document version it was extracted from.
- **Trade-off:** If the user significantly modifies the input text, they must re-extract to add new candidates to the ledger.

---

### ADR 007: Lightweight Document Ingestion (`unpdf` & `mammoth`)
- **Decision:** Use `unpdf` for PDF parsing and `mammoth` for DOCX/DOC processing in Next.js server route handlers, avoiding heavy native binaries (`pdf2json`, `tesseract.js`, or Puppeteer).
- **Rationale:**
  1. `unpdf` uses web-standard PDF.js without Node canvas dependencies, making it fast and portable.
  2. `mammoth` extracts raw text and hierarchical paragraphs from Word files without external Office runtime dependencies.
  3. Enables direct drag-and-drop of proposals, SOWs, and email export files directly into the workstation.
- **Trade-off:** Optical Character Recognition (OCR) for scanned image-only PDFs is not supported; documents must have a selectable text layer.

---

### ADR 008: Editorial Archival Metaphor over AI Chat Tropes
- **Decision:** Explicitly reject chat bubbles, conversational assistants, and floating robotic avatars. Adopt a physical archival ledger metaphor: warm paper canvas (`#F6F5F0`), deep forest ink (`#244D3A`), Newsreader serif typography, and tactile neo-brutalist status buttons.
- **Rationale:** Freelancers and agencies need an authoritative, audit-ready operational record, not a chatty conversational bot. The design reinforces clarity, accountability, and legal precision.

---

## 2. Resolved Technical Questions

1. **How should we handle reasoning / thinking token limits?**
   - *Resolution:* Passed `chat_template_kwargs: { enable_thinking: false }` to Nebius Token Factory in `src/lib/nebius-extraction.ts` and set explicit system prompts instructing the model to emit only valid JSON.
2. **How to prevent prompt injection from malicious client emails?**
   - *Resolution:* All client-supplied source text is strictly wrapped inside `<<<UNTRUSTED_COMMUNICATION_SOURCE>>>` boundary tags, and the model is explicitly instructed to treat contents within those tags strictly as data, ignoring any embedded instructions or prompts.
3. **Can the model confirm agreement items autonomously?**
   - *Resolution:* Strictly forbidden. The schema disallows `confirmed` or `dismissed` in model outputs; only a human operator can confirm or dismiss items.
4. **How do we handle informal email threads attempting to set baseline contract terms?**
   - *Resolution:* Any model-suggested `baseline` candidate originating from correspondence is automatically downgraded to `proposed` with an explanatory note (`[Downgraded from suggested baseline: live correspondence cannot unilaterally alter contract baseline without verified contract amendment]`).

---

## 3. Future Roadmap & Open Considerations

1. **Multi-User Cloud Sync & Workspaces:**
   - Exploring optional end-to-end encrypted cloud synchronization (e.g. Supabase / CRDTs) for teams of 5+ collaborators who share the same client ledger.
2. **Automated Diffing of Contract Versions:**
   - Generating visual side-by-side diffs between initial contract SOWs and final verified agreement ledgers to attach directly to final client invoices.
3. **Webhook Ingestion:**
   - Direct webhooks for Slack channels and Google Workspace to stream conversations directly into pending review queues.
