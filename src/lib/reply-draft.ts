import type { AgreementItem, ProjectData } from "./sample-data.ts";

/**
 * Pure generator for professional, non-confrontational clarification reply drafts.
 *
 * TRUST BOUNDARY & ACCURACY INVARIANTS:
 * 1. When no item is selected (item is null/undefined), returns an empty string. Never invents status reports.
 * 2. Only describes a term as part of the baseline agreement when item.status === "baseline".
 *    Proposed and unclear items are explicitly described as discussed but not yet confirmed.
 * 3. Never wraps item.claim in quotation marks. Clearly distinguishes the model summary from verbatim evidenceQuote.
 * 4. Uses speaker information only when available; otherwise uses neutral language. Never assumes a note was written.
 * 5. Contains NO unsolicited commercial commitments (no promises to accommodate, prepare change orders, or accept scope).
 * 6. Explicitly requests written confirmation or correction where appropriate.
 */
export function generateReplyDraft(
  item?: AgreementItem | null,
  project?: Partial<ProjectData> | null
): string {
  if (!item) {
    return "";
  }

  const greeting = project?.clientName?.trim()
    ? `Hi ${project.clientName.trim()},`
    : "Hello,";

  const signoff = project?.contractorName?.trim()
    ? `Best,\n${project.contractorName.trim()}`
    : "Best regards,";

  // Claim must NEVER be wrapped in quotation marks as though it were verbatim client text (Requirement 3)
  const claimText = item.claim?.trim() || "this item";

  // Verbatim quote is clearly distinguished in quotation marks (Requirement 3)
  const quoteText = item.evidenceQuote?.trim()
    ? `"${item.evidenceQuote.trim()}"`
    : "[cited evidence]";

  // Neutral speaker attribution without assuming a note was written (Requirement 4)
  const speakerIntro = item.speaker?.trim()
    ? `${item.speaker.trim()} noted:`
    : "the following was noted:";

  const isBaseline = item.status === "baseline";

  switch (item.commitmentType) {
    case "deliverables": {
      if (isBaseline) {
        return `${greeting}\n\nI am following up regarding the deliverable for ${claimText}.\n\nThis deliverable is part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your records or let me know if any written correction is needed.\n\n${signoff}`;
      }
      return `${greeting}\n\nI am writing to clarify the deliverable regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThis item was discussed but has not yet been confirmed as part of our agreed project scope. Could you please provide written confirmation or correction regarding whether this should be included?\n\n${signoff}`;
    }

    case "prices": {
      if (isBaseline) {
        return `${greeting}\n\nI wanted to verify our alignment on the pricing terms regarding ${claimText}.\n\nThis is recorded as part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your records or let me know if any written correction is needed.\n\n${signoff}`;
      }
      return `${greeting}\n\nI wanted to clarify the pricing terms regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThese terms were discussed but have not yet been confirmed as part of our agreed project commitments. Could you please provide written confirmation or correction so we can record the approved terms accurately?\n\n${signoff}`;
    }

    case "deadlines": {
      if (isBaseline) {
        return `${greeting}\n\nI wanted to verify our alignment on the project schedule regarding ${claimText}.\n\nThis timeline is part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your current schedule or let me know if any adjustments are needed.\n\n${signoff}`;
      }
      return `${greeting}\n\nI wanted to clarify the timeline regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThis milestone was discussed but has not yet been confirmed as part of our agreed project schedule. Could you please provide written confirmation or correction so we can align our delivery milestones accordingly?\n\n${signoff}`;
    }

    case "revision_limits": {
      if (isBaseline) {
        return `${greeting}\n\nI wanted to verify our alignment on the revision policy regarding ${claimText}.\n\nThese revision limits are part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your records or let me know if any written correction is needed.\n\n${signoff}`;
      }
      return `${greeting}\n\nI wanted to clarify the revision terms regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThese revision terms were discussed but have not yet been confirmed as part of our agreed project terms. Could you please provide written confirmation or correction so we can ensure our review process is mutually agreed upon?\n\n${signoff}`;
    }

    default: {
      if (isBaseline) {
        return `${greeting}\n\nI wanted to verify our alignment on the project term regarding ${claimText}.\n\nThis term is part of our baseline agreement:\n${quoteText}\n\nPlease confirm if this matches your records or let me know if any written correction is needed.\n\n${signoff}`;
      }
      return `${greeting}\n\nI wanted to clarify the project term regarding ${claimText}.\n\nIn our recent communication, ${speakerIntro}\n${quoteText}\n\nThis term was discussed but has not yet been confirmed as part of our agreed project terms. Could you please provide written confirmation or correction so we can update our records accordingly?\n\n${signoff}`;
    }
  }
}
