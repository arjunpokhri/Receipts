import type {
  CommitmentType,
  SpeechAct,
  ApplicationStatus,
  SuggestedStatus,
} from "./schema.ts";

export interface AgreementItem {
  id: string;
  claim: string;
  evidenceQuote: string;
  speaker: string;
  timestamp: string;
  commitmentType: CommitmentType;
  speechAct: SpeechAct;
  status: ApplicationStatus;
  explanation: string;
  sourceThreadId: string;
  /** Optional stored source communication text directly attached to the item */
  sourceText?: string;
  /** Optional original status suggested by model before trust-boundary policy adjustments */
  originalSuggestedStatus?: SuggestedStatus;
  /** Whether the evidence quotation was mechanically verified against source text */
  quoteVerified?: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  dismissedAt?: string;
}

export interface ConversationThread {
  id: string;
  title: string;
  channel: "Email" | "Slack" | "Meeting Recap";
  date: string;
  participants: string[];
  rawText: string;
}

export interface ProjectData {
  id: string;
  title: string;
  clientName: string;
  clientCompany: string;
  contractorName: string;
  startDate: string;
  currency: string;
  threads: ConversationThread[];
  initialItems: AgreementItem[];
}

export const DEFAULT_CLEAN_PROJECT: ProjectData = {
  id: "proj-clean-workspace",
  title: "Client Scope Workspace",
  clientName: "Client",
  clientCompany: "Active Workspace",
  contractorName: "Studio Mono",
  startDate: "Oct 29, 2026",
  currency: "USD",
  threads: [],
  initialItems: [],
};

export const SAMPLE_PROJECT: ProjectData = {
  id: "proj-aura-health-2026",
  title: "Aura Health — Brand & Product Architecture",
  clientName: "Elena Vance",
  clientCompany: "Aura Health Inc. (Demo)",
  contractorName: "Marcus Miller (Studio Mono)",
  startDate: "Oct 2, 2026",
  currency: "USD",
  threads: [
    {
      id: "thread-kickoff",
      title: "Project Kickoff & Baseline Scope Agreement",
      channel: "Email",
      date: "Oct 2, 2026, 09:30 AM",
      participants: ["Elena Vance <elena@client.co>", "Marcus Miller <marcus@studio.co>"],
      rawText: `From: Elena Vance <elena@client.co>
Date: Oct 2, 2026, 09:30 AM
To: Marcus Miller <marcus@studio.co>
Subject: Project Kickoff & Baseline Scope

Hi Marcus,

As summarized in our kickoff call, the agreed initial scope covers 3 custom landing page responsive wireframes and one brand mood board for a flat fixed fee of $3,500. We look forward to getting started.

Please note that we need the Figma deliverables delivered by next Friday, October 17th.
Regarding revisions: "We agree on up to 2 rounds of design revisions."
Any additional rounds beyond that will be billed at $120/hr.

Best,
Elena`,
    },
    {
      id: "thread-feature-request",
      title: "Interactive 3D Viewer Request",
      channel: "Email",
      date: "Oct 5, 2026, 02:15 PM",
      participants: ["Greg Thorne <greg@client.co>", "Marcus Miller <marcus@studio.co>"],
      rawText: `From: Greg Thorne <greg@client.co>
Date: Oct 5, 2026, 02:15 PM
To: Marcus Miller <marcus@studio.co>

Hi Marcus,

The homepage layout looks solid. Could we also add an interactive 3D product viewer module right below the hero section? Our marketing team thinks it would boost conversions.

We would need this ready alongside the main delivery on October 17th if possible.

Thanks,
Greg`,
    },
    {
      id: "thread-rates-dispute",
      title: "Weekend Staging Surcharge Alignment",
      channel: "Slack",
      date: "Oct 8, 2026, 10:32 AM",
      participants: ["Alex (Studio Mono)", "Sam (Client Operations)"],
      rawText: `Thread Transcript #general-ops:
[10:14 AM] Alex (Studio Mono): 'The surcharge for weekend maintenance and off-hours staging will be $150/hr as discussed.'
[10:32 AM] Sam (Client Operations): 'Understood, we are okay with the $100/hr weekend surcharge as long as logs are provided.'
[10:45 AM] Alex (Studio Mono): 'Wait Sam, our standard SLA rate for weekends is strictly $150/hr.'`,
    },
  ],
  initialItems: [
    {
      id: "item-01",
      claim: "Deliverables include 3 custom landing page responsive wireframes and one brand mood board",
      evidenceQuote: "the agreed initial scope covers 3 custom landing page responsive wireframes and one brand mood board",
      speaker: "Elena Vance",
      timestamp: "Oct 2, 2026, 09:30 AM",
      commitmentType: "deliverables",
      speechAct: "commitment",
      status: "baseline",
      explanation: "Original signed kickoff scope agreed as baseline deliverable.",
      sourceThreadId: "thread-kickoff",
    },
    {
      id: "item-02",
      claim: "Fixed project price of $3,500 for the baseline scope",
      evidenceQuote: "flat fixed fee of $3,500",
      speaker: "Elena Vance",
      timestamp: "Oct 2, 2026, 09:30 AM",
      commitmentType: "prices",
      speechAct: "commitment",
      status: "baseline",
      explanation: "Agreed baseline fee documented for kickoff deliverables.",
      sourceThreadId: "thread-kickoff",
    },
    {
      id: "item-03",
      claim: "Figma wireframe deliverables due by Friday, October 17th",
      evidenceQuote: "we need the Figma deliverables delivered by next Friday, October 17th",
      speaker: "Elena Vance",
      timestamp: "Oct 2, 2026, 09:30 AM",
      commitmentType: "deadlines",
      speechAct: "commitment",
      status: "baseline",
      explanation: "Milestone completion deadline established at kickoff.",
      sourceThreadId: "thread-kickoff",
    },
    {
      id: "item-04",
      claim: "Up to 2 rounds of design revisions included; extra rounds billed at $120/hr",
      evidenceQuote: "We agree on up to 2 rounds of design revisions",
      speaker: "Elena Vance",
      timestamp: "Oct 2, 2026, 09:30 AM",
      commitmentType: "revision_limits",
      speechAct: "commitment",
      status: "baseline",
      explanation: "Contractual revision threshold and rate cap for overrun iterations.",
      sourceThreadId: "thread-kickoff",
    },
    {
      id: "item-05",
      claim: "Client requests an interactive 3D product viewer module below hero section",
      evidenceQuote: "Could we also add an interactive 3D product viewer module right below the hero section?",
      speaker: "Greg Thorne",
      timestamp: "Oct 5, 2026, 02:15 PM",
      commitmentType: "deliverables",
      speechAct: "request",
      status: "proposed",
      explanation: "Unilateral feature request outside baseline scope; requires change order approval.",
      sourceThreadId: "thread-feature-request",
    },
    {
      id: "item-06",
      claim: "Discrepancy in weekend maintenance surcharge ($100/hr client counter vs. $150/hr agency SLA)",
      evidenceQuote: "we are okay with the $100/hr weekend surcharge as long as logs are provided.",
      speaker: "Sam (Client Operations)",
      timestamp: "Oct 8, 2026, 10:32 AM",
      commitmentType: "prices",
      speechAct: "proposal",
      status: "unclear",
      explanation: "Conflicting rate terms across Slack thread. Client offered $100/hr while agency quoted $150/hr.",
      sourceThreadId: "thread-rates-dispute",
    },
  ],
};
