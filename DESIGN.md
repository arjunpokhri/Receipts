# Receipts Design & Visual Specification

## 1. Product & Aesthetic Principles

- **Product:** Receipts — an evidence-backed agreement and scope tracker for freelancers and small agencies.
- **Foundational Aesthetic:** Editorial minimalism with high typographic refinement, structured around an archival ledger metaphor.
- **Signature Hybrid Design System:**
  1. **Editorial Minimalism (Foundation):** Clean whitespace, Newsreader serif headings, high-contrast borders, structured tables, and focused quotation inspection.
  2. **Glassmorphism (Signature Accent):** Semi-transparent floating inspectors, overlays, and header bars with subtle backdrop blur (`backdrop-blur-md bg-white/80`) and crisp boundary borders (`border-[#20251F]/10`).
  3. **Bento Grids (Overview Architecture):** Multi-card overview dashboard organizing project status, scope bounds, evidence grounding %, and pending drift.
  4. **Neumorphism (Tactile Restraint):** Reserved for small interactive controls and segmented toggles, combining soft inner/drop shadows with high-contrast borders to preserve accessibility.
  5. **Neo-Brutalism (Signature Accents):** Crisp, flat-faced action buttons with hard-offset borders and shadows (`shadow-[2px_2px_0px_#20251F]`, `shadow-[3px_3px_0px_#244D3A]`), sharp corners, and high-visibility status badges.
- **Zero AI-Chat Tropes:** Strictly avoid chat bubbles, floating avatars, typing animations, or conversational prompts. Receipts is an audit ledger and operational workstation.
- **Zero Fabricated Metrics:** The UI displays only real, deterministic checks that actually ran locally. Model tokens, latencies, and costs are omitted until live API calls are configured.

---

## 2. Visual Tokens & Theme Variables

All visual variables are defined as reusable CSS custom properties in `src/app/globals.css`:

```css
:root {
  /* Paper & Surface Neutrals */
  --paper: #F6F5F0;
  --paper-card: #FFFFFF;
  --paper-subtle: #EFEFE9;

  /* Primary Brand & Typography */
  --forest: #244D3A;
  --forest-dark: #193629;
  --forest-light: #2E5F48;
  --ink: #20251F;
  --ink-muted: #576356;
  --ink-subtle: #889386;
  --sage: #E7EEE8;
  --sage-border: #D8E0D9;

  /* Semantic Status Tokens */
  --amber-state: #C58A36;
  --amber-bg: #FAF3E8;
  --amber-border: #E8CA97;
  --coral-state: #C95C4B;
  --coral-bg: #FAEEEC;
  --coral-border: #EAB2A9;
  --emerald-state: #2E7D5B;
  --emerald-bg: #EBF5F0;
  --emerald-border: #A3D3BE;
}
```

### Color Semantics

| State | Color | Tokens | Semantic Application |
|---|---|---|---|
| **Forest Brand** | Deep Forest `#244D3A` | `--forest`, `--forest-dark` | Wordmark, primary actions, confirmed baseline status, active sidebar tabs |
| **Paper Canvas** | Warm Off-White `#F6F5F0` | `--paper`, `--paper-card` | Global background canvas, container panels, card surfaces |
| **Ink** | Charcoal Ink `#20251F` | `--ink`, `--ink-muted` | High-contrast typography, structural 1px borders, brutalist button shadows |
| **Amber** | Warm Amber `#C58A36` | `--amber-state`, `--amber-bg` | Proposed changes, unclear agreements, potential scope creep warnings |
| **Coral** | Brick Coral `#C95C4B` | `--coral-state`, `--coral-bg` | Dismissed scope items, failed verifier checks, quotation mismatch warnings |
| **Emerald** | Archival Emerald `#2E7D5B` | `--emerald-state`, `--emerald-bg` | Mechanically verified quotes, confirmed human approvals |

---

## 3. Typography Hierarchy

Configured via `next/font/google` in `src/app/layout.tsx`:

- **Editorial Headings & Brand:** `Newsreader` (`font-serif`, italic variants supported)
  - Used for the Receipts brand wordmark, page titles, section callouts, and verbatim evidence quotes.
- **UI Structure & Controls:** `Geist Sans` (`font-sans`)
  - Used for table headers, metadata badges, labels, form buttons, and body navigation.
- **Code, Hashes & Quotation Analysis:** `Geist Mono` (`font-mono`)
  - Used for timestamps, verbatim match spans, JSON audit traces, raw input strings, and character counters.

---

## 4. Implemented Component Architecture

```
src/
├── app/
│   ├── layout.tsx         # Font injections (Newsreader, Geist Sans, Geist Mono) & metadata
│   ├── globals.css        # CSS variables, neo-brutalist buttons, glassmorphic styling
│   └── page.tsx           # Main workstation coordinator, state transitions, tab router
├── components/
│   ├── icons.tsx          # Minimalist, zero-dependency SVG icons
│   ├── Sidebar.tsx        # Desktop sidebar with wordmark, navigation tabs, offline pill
│   ├── Header.tsx         # Project metadata, markdown exporter (download/copy), reset action
│   ├── BentoOverview.tsx  # Multi-card bento grid: baseline, pending, grounding %, scope bounds
│   ├── AgreementLedger.tsx# Tabular agreement state with filters, search, and human action buttons
│   ├── RequestReview.tsx  # Delta analysis view comparing new requests against baseline terms
│   ├── EvidenceInspector.tsx # Verbatim quote viewer with live substring verification & disclaimer
│   ├── ReplyDraftPanel.tsx   # Evidence-grounded client communication generator with clipboard action
│   ├── ExecutionTracePanel.tsx # Deterministic local audit trail (schema & verifier checks)
│   └── CustomTextVerifier.tsx# Live mechanical substring verification testbench
└── lib/
    ├── sample-data.ts     # Realistic bundled project: "Aura Health Inc."
    ├── verifier.ts        # Deterministic substring verifier (Unicode/whitespace normalization)
    ├── schema.ts          # Zod extraction schemas & application status constraints
    ├── extraction-prompt.ts# Prompt builder for future Nebius/Nemotron extraction calls
    └── evaluate-extraction.ts # Offline extraction evaluation engine & score calculator
```

### Key Workstation Views:
1. **Ledger (`ledger`):** High-density table of all commitments. Allows human users to confirm proposed items or dismiss non-contractual scope.
2. **Delta Review (`review`):** Compares pending client requests directly against established kickoff terms to highlight scope drift.
3. **Evidence Inspector (`evidence`):** Highlights exact quote positions within full email/Slack transcripts, validates against `verifyEvidence`, and prominently displays the methodological disclaimer.
4. **Clarification Draft (`draft`):** Generates pre-filled, polite, evidence-grounded replies explaining baseline boundaries and offering change-order options.
5. **Execution Trace (`trace`):** Displays real-time validation results for candidates and deterministic string checks.
6. **Live Substring Tester (`custom`):** Interactive sandbox allowing operators to test any arbitrary text string against candidate quotations without mock AI claims.

---

## 5. Human-in-the-Loop Governance

In strict adherence to `SPEC.md`:
- **AI-Extracted Statuses:** The AI model is strictly restricted to proposing `baseline`, `proposed`, or `unclear`.
- **Application Statuses:** Only human operators can move an item to `confirmed` or `dismissed`.
- **Methodological Disclaimer:** Every quotation inspection view displays:
  > *"Mechanical verification proves only that quoted text exists as a verbatim substring in the source document. It does not establish legal agreement or claim accuracy without human review."*
