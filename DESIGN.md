# Receipts Design & Visual Specification

## 1. Product & Aesthetic Principles

- **Product:** Receipts — an evidence-backed agreement and scope tracker for freelancers and boutique agencies.
- **Metaphor:** The Archival Ledger — physical paperwork rigor, clean typographic authority, and verifiable accounting clarity.
- **Design Philosophy:**
  1. **Editorial Minimalism (Foundation):** Generous margins, Newsreader serif headings, high-contrast borders, structured tables, and focused quotation inspection.
  2. **Tactile Neo-Brutalism (Signature Accents):** Crisp, flat-faced action buttons with hard-offset borders and drop shadows (`shadow-[2px_2px_0px_#20251F]`, `shadow-[3px_3px_0px_#244D3A]`), sharp corners, and high-visibility status badges.
  3. **Bento Grids (Overview Architecture):** Multi-card dashboard summarizing project status, confirmed baselines, pending drift, and mechanical grounding percentages.
  4. **Glassmorphism & Ambient Light (Atmosphere):** Floating modal backdrops (`backdrop-blur-md bg-black/40`), subtle glowing Aurora accents (`AuroraBackground.tsx`), and crisp boundary borders (`border-[#20251F]/10`).
- **Zero AI-Chat Tropes:** Strictly avoid chat bubbles, floating avatars, typing indicators, and conversational prompts. Receipts is an audit ledger and operational workstation.
- **Zero Fabricated Metrics:** The UI displays only real, deterministic checks that actually ran locally or on-server.

---

## 2. Visual Tokens & CSS Variables

Defined as CSS variables in `src/app/globals.css`:

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

| State / Role | Hex / Value | Token | Visual Application |
|---|---|---|---|
| **Forest Brand** | `#244D3A` | `--forest` | Receipts wordmark, primary CTA buttons, active sidebar tab, confirmed pill |
| **Paper Canvas** | `#F6F5F0` | `--paper` | Global background canvas, container panels, card surfaces |
| **Charcoal Ink** | `#20251F` | `--ink` | Primary typography, table headers, brutalist button borders & shadows |
| **Warm Amber** | `#C58A36` | `--amber-state` | Proposed changes, unclear agreements, potential scope creep warnings |
| **Brick Coral** | `#C95C4B` | `--coral-state` | Dismissed scope items, failed verifier checks, quotation mismatch warnings |
| **Archival Emerald** | `#2E7D5B` | `--emerald-state` | Mechanically verified quotes, confirmed human approvals |
| **Clean White** | `#FFFFFF` | `--paper-card` | Data tables, inspection panels, logo badge background in dark mode |

---

## 3. Typography Hierarchy

Injected via `next/font/google` in `src/app/layout.tsx`:

- **Editorial Headings & Brand:** `Newsreader` (`font-serif`, italic variants supported)
  - Used for the Receipts wordmark, project titles, section callouts, and verbatim evidence quotes (`italic font-serif`).
- **UI Structure & Controls:** `Geist Sans` (`font-sans`)
  - Used for table headers, metadata badges, labels, form buttons, and body navigation.
- **Code, Hashes & Quotation Analysis:** `Geist Mono` (`font-mono`)
  - Used for timestamps, verbatim match spans, character count indicators, JSON audit traces, and raw input strings.

---

## 4. Component Catalog & Architecture

```
src/components/
├── AgreementLedger.tsx       # Core agreement ledger table with filters, search, and action controls
├── BentoOverview.tsx         # Bento-grid dashboard cards summarizing scope bounds and grounding
├── CustomTextVerifier.tsx    # Live extraction & document upload testbench with snapshot controls
├── EvidenceInspector.tsx     # Slide-over verbatim quote inspector with character span highlight
├── ExecutionTracePanel.tsx   # Detailed mechanical audit trace and schema validation diagnostics
├── Header.tsx                # Workspace project header, verified item counter, and Markdown export
├── InteractiveTourModal.tsx  # Multi-step guided interactive walkthrough for first-time visitors
├── LogoIntroOverlay.tsx      # Welcome splash screen displaying the official Receipts logo badge
├── ProjectModal.tsx          # Project manager modal: create, switch, and delete client projects
├── AddAgreementItemModal.tsx # Manual baseline / agreement addition modal with evidence inputs
├── QuickStartGuide.tsx       # Expandable quickstart card with workflow tips and keyboard hints
├── ReplyDraftPanel.tsx       # Evidence-grounded client clarification drafter with copy action
├── RequestReview.tsx         # Comparative delta analysis comparing new requests against baseline
├── RevealSection.tsx         # Smooth reveal animation container for workflow sections
├── Sidebar.tsx               # Left navigation bar with project switcher and active tab router
├── AuroraBackground.tsx      # Ambient multi-color gradient aurora canvas accent
└── icons.tsx                 # Zero-dependency, accessible, clean SVG icon library
```

---

## 5. Dark Mode & High-Contrast Guidelines

1. **Clean White Logo Badge:**
   - In both light and dark themes, the official Receipts logo badge preserves a clean white backdrop (`bg-white ring-1 ring-black/10 rounded-lg p-1.5`) to ensure maximum legibility, brand contrast, and sharpness against dark container headers or sidebar surfaces.
2. **Text Readability:**
   - Dark mode background: Deep Charcoal `#121614` with `#1E2521` card containers.
   - High-contrast text: `#F6F5F0` primary headings, `#A2ADA3` secondary labels.
3. **Tactile Button Shadows:**
   - Flat brutalist button shadows adapt gracefully in dark mode to retain tactile depth without glowing or blurring.
