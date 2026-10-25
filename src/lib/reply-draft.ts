import type { AgreementItem, ProjectData } from "./sample-data.ts";

/**
 * Returns a status-appropriate label for agreement items in the UI.
 * Requirement 2: Baseline, Confirmed, Dismissed, or Discussed/Pending.
 */
export function getStatusLabel(status?: AgreementItem["status"] | string): string {
  switch (status) {
    case "baseline":
      return "Baseline";
    case "confirmed":
      return "Confirmed";
    case "dismissed":
      return "Dismissed";
    case "proposed":
    case "unclear":
    default:
      return "Discussed/Pending";
  }
}

/**
 * Returns a descriptive attribution verb based on the candidate's speech act.
 * Requirement 4:
 * - request -> "requested"
 * - question -> "asked"
 * - rejection -> "declined"
 * - acceptance -> "replied"
 * - other or unknown -> "noted"
 */
export function getSpeechActVerb(speechAct?: string): string {
  switch (speechAct) {
    case "request":
      return "requested";
    case "question":
      return "asked";
    case "rejection":
      return "declined";
    case "acceptance":
      return "replied";
    default:
      return "noted";
  }
}

/**
 * Pure generator for professional, non-confrontational clarification reply drafts.
 *
 * TRUST BOUNDARY & ACCURACY INVARIANTS:
 * 1. When no item is selected (item is null/undefined) or item is dismissed, returns an empty string.
 * 2. Only describes a term as part of the baseline agreement when item.status === "baseline".
 *    Proposed and unclear items are explicitly described as discussed but not yet confirmed.
 *    Confirmed items are described as agreed and confirmed, inviting corrections only.
 * 3. Never wraps item.claim in quotation marks. Clearly distinguishes the model summary from verbatim evidenceQuote.
 * 4. Speech-act-aware attribution: uses requested, asked, declined, replied, or noted.
 * 5. Contains NO unsolicited commercial commitments (no promises to accommodate, prepare change orders, or accept scope).
 * 6. Uses project client/contractor identities ONLY for bundled sample items without sourceText.
 *    Live-extracted items always use neutral greetings ("Hello,") and sign-offs ("Best regards,").
 */
export function generateReplyDraft(
  item?: AgreementItem | null,
  project?: Partial<ProjectData> | null
): string {
  // Requirement 1: Null selection or dismissed item returns an empty draft
  if (!item || item.status === "dismissed") {
    return "";
  }

  // Requirement 3: Use project names ONLY for bundled sample items without their own sourceText.
  // Live items (with sourceText) strictly use neutral greetings and sign-offs.
  const isLiveItem = typeof item.sourceText === "string" && item.sourceText.trim().length > 0;

  const greeting = !isLiveItem && project?.clientName?.trim()
    ? `Hi ${project.clientName.trim()},`
    : "Hello,";

  const signoff = !isLiveItem && project?.contractorName?.trim()
    ? `Best,\n${project.contractorName.trim()}`
    : "Best regards,";

  // Claim must NEVER be wrapped in quotation marks as though it were verbatim client text
  const claimText = item.claim?.trim() || "this item";

  // Verbatim quote is clearly distinguished in quotation marks
  const quoteText = item.evidenceQuote?.trim()
    ? `"${item.evidenceQuote.trim()}"`
    : "[cited evidence]";

  // Requirement 4: Speech-act-aware attribution
  const verb = getSpeechActVerb(item.speechAct);
  const speakerIntro = item.speaker?.trim()
    ? `${item.speaker.trim()} ${verb}:`
    : (verb === "replied" ? "the following reply was noted:" : `the following was ${verb}:`);

  const status = item.status;

  // Case A: Baseline items
  if (status === "baseline") {
    switch (item.commitmentType) {
      case "deliverables":
        return `${greeting}\n\nI am following up regarding the deliverable for ${claimText}.\n\nThis deliverable is part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your records or let me know if any written correction is needed.\n\n${signoff}`;
      case "prices":
        return `${greeting}\n\nI wanted to verify our alignment on the pricing terms regarding ${claimText}.\n\nThis is recorded as part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your records or let me know if any written correction is needed.\n\n${signoff}`;
      case "deadlines":
        return `${greeting}\n\nI wanted to verify our alignment on the project schedule regarding ${claimText}.\n\nThis timeline is part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your current schedule or let me know if any adjustments are needed.\n\n${signoff}`;
      case "revision_limits":
        return `${greeting}\n\nI wanted to verify our alignment on the revision policy regarding ${claimText}.\n\nThese revision limits are part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your records or let me know if any written correction is needed.\n\n${signoff}`;
      default:
        return `${greeting}\n\nI wanted to verify our alignment on the project term regarding ${claimText}.\n\nThis term is part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your records or let me know if any written correction is needed.\n\n${signoff}`;
    }
  }

  // Case B: Confirmed items (recorded as agreed and confirmed; invite corrections only)
  if (status === "confirmed") {
    switch (item.commitmentType) {
      case "deliverables":
        return `${greeting}\n\nI am following up regarding the deliverable for ${claimText}.\n\nThis deliverable is recorded as agreed and confirmed in our project scope:\n${quoteText}\n\nPlease let me know if any written corrections are needed.\n\n${signoff}`;
      case "prices":
        return `${greeting}\n\nI wanted to confirm our records regarding the pricing terms for ${claimText}.\n\nThis pricing term is recorded as agreed and confirmed in our project commitments:\n${quoteText}\n\nPlease let me know if any written corrections are needed.\n\n${signoff}`;
      case "deadlines":
        return `${greeting}\n\nI wanted to confirm our records regarding the timeline for ${claimText}.\n\nThis milestone is recorded as agreed and confirmed in our project schedule:\n${quoteText}\n\nPlease let me know if any written corrections are needed.\n\n${signoff}`;
      case "revision_limits":
        return `${greeting}\n\nI wanted to confirm our records regarding the revision terms for ${claimText}.\n\nThese revision limits are recorded as agreed and confirmed in our project terms:\n${quoteText}\n\nPlease let me know if any written corrections are needed.\n\n${signoff}`;
      default:
        return `${greeting}\n\nI wanted to confirm our records regarding the project term for ${claimText}.\n\nThis term is recorded as agreed and confirmed in our project terms:\n${quoteText}\n\nPlease let me know if any written corrections are needed.\n\n${signoff}`;
    }
  }

  // Case C: Proposed and unclear items (discussed but not yet confirmed)
  switch (item.commitmentType) {
    case "deliverables":
      return `${greeting}\n\nI am writing to clarify the deliverable regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThis item was discussed but has not yet been confirmed as part of our agreed project scope. Could you please provide written confirmation or correction regarding whether this should be included?\n\n${signoff}`;
    case "prices":
      return `${greeting}\n\nI wanted to clarify the pricing terms regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThese terms were discussed but have not yet been confirmed as part of our agreed project commitments. Could you please provide written confirmation or correction so we can record the approved terms accurately?\n\n${signoff}`;
    case "deadlines":
      return `${greeting}\n\nI wanted to clarify the timeline regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThis milestone was discussed but has not yet been confirmed as part of our agreed project schedule. Could you please provide written confirmation or correction so we can align our delivery milestones accordingly?\n\n${signoff}`;
    case "revision_limits":
      return `${greeting}\n\nI wanted to clarify the revision terms regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThese revision terms were discussed but have not yet been confirmed as part of our agreed project terms. Could you please provide written confirmation or correction so we can ensure our review process is mutually agreed upon?\n\n${signoff}`;
    default:
      return `${greeting}\n\nI wanted to clarify the project term regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThis term was discussed but has not yet been confirmed as part of our agreed project terms. Could you please provide written confirmation or correction so we can update our records accordingly?\n\n${signoff}`;
  }
}
