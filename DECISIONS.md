# Receipts Architectural Decisions & Open Questions

## 1. Architectural Decisions

### ADR 001: Next.js App Router with TypeScript & Tailwind CSS
- **Decision:** Use Next.js 16 with App Router, TypeScript, and Tailwind CSS.
- **Rationale:** Provides modern, type-safe fullstack React capabilities, fast server actions / API route support, and rapid utility styling without heavy design system dependencies.
- **Trade-off:** Strict SSR hydration rules and file layout constraints, easily managed by keeping data-driven panels explicit.

### ADR 002: Minimal External Dependencies
- **Decision:** Restrict external runtime libraries strictly to `openai` (official client compatible with OpenAI-compatible endpoints such as Nebius Token Factory) and `zod` for runtime schema enforcement.
- **Rationale:** Avoids dependency bloat, reduces security surface, and ensures clear, maintainable data structures.
- **Trade-off:** UI components and state handlers are authored natively rather than imported from monolithic component suites.

### ADR 003: Deterministic Evidence Verification Layer
- **Decision:** Decouple model inference from evidence verification. Every candidate quote returned by an LLM is passed through a deterministic string matching check (`sourceText.includes(quote.trim())`) before display.
- **Rationale:** LLMs can paraphrase or subtly alter quotes. Grounding must be strictly verified mathematically, not assumed.

### ADR 004: In-Memory / Local Storage State for MVP
- **Decision:** Defer databases and remote state synchronization. Operate on local state with exportable Markdown ledgers.
- **Rationale:** Eliminates authentication overhead, privacy liabilities regarding sensitive client contract data, and cloud hosting costs.

---

## 2. Open Questions & Technical Risks

1. **Nebius / NVIDIA Model Selection & Token Limits:**
   - Which specific open-weights model hosted on Nebius (e.g. Llama 3.1 70B/8B, Mistral, or Qwen) delivers optimal extraction precision and strict JSON adherence within acceptable latency?
   - Need to evaluate live model latency and cost on long email threads (3,000+ tokens).

2. **Fuzzy vs. Verbatim Substring Matching:**
   - Raw client transcripts often have minor whitespace inconsistencies, line breaks, or curly quotes. Should the verification layer normalize whitespace and punctuation before checking for exact substrings?

3. **Multi-Turn Scope Evolution:**
   - When a proposal evolves over multiple messages before being accepted, should the UI track the chronological delta chain or only the terminal state?

4. **Market & Workflow Assumptions:**
   - While the problem of unbilled scope creep is common, user adoption depends on minimal friction when copying and pasting conversation logs. The threshold of manual confirmation vs. cognitive load needs empirical testing with users.
