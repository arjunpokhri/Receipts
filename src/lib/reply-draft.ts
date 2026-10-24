import type { AgreementItem, ProjectData } from "./sample-data.ts";

/**
 * Pure generator for professional, non-confrontational clarification reply drafts.
 *
 * TRUST BOUNDARY & ACCURACY INVARIANTS:
 * 1. Uses ONLY information explicitly present in the item, its verified evidence, and provided project data.
 * 2. NEVER invents prices (e.g. $3,500, $150/hr), dates (e.g. October 17th), scope phases, or commitments.
 * 3. Uses neutral greetings and sign-offs when client or contractor names are missing.
 * 4. Grounded in verbatim evidence quotations without fabricating contractual terms.
 */
export function generateReplyDraft(
  item?: AgreementItem | null,
  project?: Partial<ProjectData> | null
): string {
  const greeting = project?.clientName?.trim()
    ? `Hi ${project.clientName.trim()},`
    : "Hello,";

  const signoff = project?.contractorName?.trim()
    ? `Best,\n${project.contractorName.trim()}`
    : "Best regards,";

  if (!item) {
    const projectContext = project?.title?.trim()
      ? ` for ${project.title.trim()}`
      : "";
    return `${greeting}\n\nThanks for checking in. We are on schedule with our baseline commitments${projectContext}. Please let us know if there is anything else you need.\n\n${signoff}`;
  }

  const claimPhrase = item.claim?.trim() ? `the "${item.claim.trim()}"` : "this scope item";
  const quotePhrase = item.evidenceQuote?.trim()
    ? `"${item.evidenceQuote.trim()}"`
    : "[cited evidence]";

  switch (item.commitmentType) {
    case "deliverables": {
      return `${greeting}\n\nThanks for sending over the note regarding ${claimPhrase}.\n\nTo ensure our agreed project milestones remain on track, I wanted to clarify how this relates to our baseline agreement (${quotePhrase}).\n\nIf this represents an addition to our agreed scope, we would be glad to accommodate it. We can prepare a quick change order or schedule it as an add-on so we keep our existing delivery commitments on track.\n\nPlease let me know how you would like to proceed.\n\n${signoff}`;
    }

    case "prices": {
      const claimContext = item.claim?.trim() ? ` ("${item.claim.trim()}")` : "";
      return `${greeting}\n\nI wanted to quickly align on the pricing and rate terms mentioned in our conversation:\n\n${quotePhrase}\n\nRegarding this item${claimContext}, could you confirm if this matches your understanding so we can record it accurately in our agreed project terms?\n\n${signoff}`;
    }

    case "deadlines": {
      const claimContext = item.claim?.trim() ? ` ("${item.claim.trim()}")` : "";
      return `${greeting}\n\nI wanted to check in regarding the timeline mentioned in our discussion:\n\n${quotePhrase}\n\nRegarding this schedule${claimContext}, please confirm if this timeline works on your end so we can align our delivery milestones accordingly.\n\n${signoff}`;
    }

    case "revision_limits": {
      const claimContext = item.claim?.trim() ? ` ("${item.claim.trim()}")` : "";
      return `${greeting}\n\nI wanted to clarify the revision terms noted in our conversation:\n\n${quotePhrase}\n\nRegarding these revisions${claimContext}, could you confirm if this matches our agreed revision scope before we proceed?\n\n${signoff}`;
    }

    default: {
      const claimContext = item.claim?.trim() ? ` concerning "${item.claim.trim()}"` : "";
      return `${greeting}\n\nRegarding our recent discussion (${quotePhrase})${claimContext}:\n\nI wanted to confirm how you would like to incorporate this into our project schedule and agreed terms. Could you confirm if this is approved so we can update our records accordingly?\n\n${signoff}`;
    }
  }
}
