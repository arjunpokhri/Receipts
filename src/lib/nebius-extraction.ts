/**
 * Server-Side Nebius / NVIDIA Nemotron Extraction Engine
 *
 * Calls the Nebius Token Factory OpenAI-compatible API to extract commitments
 * from raw client communication, enforces Zod schema validation, and runs
 * deterministic evidence verification on every extracted quote before returning.
 *
 * CRITICAL SAFETY RULES:
 * 1. Server-side only: NEVER expose NEBIUS_API_KEY to browser code or API responses.
 * 2. Model suggests only baseline, proposed, or unclear; never confirmed or dismissed.
 * 3. Every quote is verified against sourceText via verifyEvidence; unverified quotes
 *    are marked as quoteVerified: false.
 * 4. Token length truncation (finish_reason === 'length') is treated as an error.
 */

import OpenAI from "openai";
import {
  ExtractionResultSchema,
  type ExtractedCandidate,
} from "./schema.ts";
import {
  buildExtractionMessages,
  type ExtractionPromptOptions,
} from "./extraction-prompt.ts";
import {
  verifyEvidence,
  type VerificationResult,
} from "./verifier.ts";

export interface VerifiedExtractedCandidate extends ExtractedCandidate {
  id: string;
  quoteVerified: boolean;
  verificationDetails: VerificationResult;
}

export interface NebiusExtractionResult {
  candidates: VerifiedExtractedCandidate[];
  rawCandidateCount: number;
  verifiedQuoteCount: number;
  rejectedQuoteCount: number;
  model: string;
  durationMs: number;
}

export interface ExtractCommitmentsOptions extends ExtractionPromptOptions {
  /** Optional API key override (defaults to process.env.NEBIUS_API_KEY) */
  apiKey?: string;
  /** Optional base URL override (defaults to process.env.NEBIUS_BASE_URL) */
  baseURL?: string;
  /** Optional model identifier override (defaults to process.env.NEBIUS_MODEL) */
  model?: string;
  /** Injected OpenAI client instance (primarily used for unit testing and mocking) */
  client?: OpenAI;
  /** Request timeout in milliseconds (defaults to 45000) */
  timeoutMs?: number;
  /** Maximum output token ceiling (defaults to 4096) */
  maxTokens?: number;
  /** Whether to enable thinking traces if supported by backend (defaults to false for structured JSON stability) */
  enableThinking?: boolean;
}

/**
 * Strips reasoning tags and markdown fences to reliably extract JSON content.
 */
export function extractCleanJsonString(rawContent: string): string {
  let cleaned = rawContent.trim();

  // If the model produced thought/reasoning tags, isolate content after </think>
  if (cleaned.includes("<think>")) {
    const thinkEndIdx = cleaned.indexOf("</think>");
    if (thinkEndIdx !== -1) {
      cleaned = cleaned.slice(thinkEndIdx + "</think>".length).trim();
    } else {
      throw new Error("Response was cut off inside a thinking process block.");
    }
  }

  // Strip markdown code fences if present (```json ... ```)
  const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  return cleaned;
}

/**
 * Executes server-side extraction of commitments from sourceText using Nebius Token Factory.
 */
export async function extractCommitmentsWithNebius(
  sourceText: string,
  options: ExtractCommitmentsOptions = {}
): Promise<NebiusExtractionResult> {
  const startTime = Date.now();

  // 1. Input validation
  if (!sourceText || typeof sourceText !== "string" || sourceText.trim().length === 0) {
    throw new Error("Source communication text cannot be empty.");
  }

  // 2. Resolve credentials and configuration
  const apiKey = options.apiKey || process.env.NEBIUS_API_KEY;
  const baseURL =
    options.baseURL ||
    process.env.NEBIUS_BASE_URL ||
    "https://api.tokenfactory.nebius.com/v1/";
  const model =
    options.model ||
    process.env.NEBIUS_MODEL ||
    "nvidia/Nemotron-3_5-Lightning";

  if (!apiKey && !options.client) {
    throw new Error(
      "Nebius API key is not configured. Please set NEBIUS_API_KEY in environment variables."
    );
  }

  const timeoutMs = options.timeoutMs ?? 45000;
  const maxTokens = options.maxTokens ?? 4096;

  // 3. Initialize or use injected client
  const client =
    options.client ||
    new OpenAI({
      baseURL,
      apiKey,
      timeout: timeoutMs,
      maxRetries: 1,
    });

  // 4. Build system & user messages
  const messages = buildExtractionMessages(sourceText, {
    projectContext: options.projectContext,
  });

  const enableThinking = options.enableThinking ?? false;

  // 5. Invoke chat completion
  // Pass chat_template_kwargs: { enable_thinking: false } supported by vLLM/Nebius to disable unbounded CoT
  const completionPayload: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
    chat_template_kwargs?: { enable_thinking?: boolean };
  } = {
    model,
    messages,
    response_format: { type: "json_object" },
    max_tokens: maxTokens,
    temperature: 0,
    chat_template_kwargs: {
      enable_thinking: enableThinking,
    },
  };

  const response = await client.chat.completions.create(
    completionPayload as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
  );

  const choice = response.choices?.[0];
  if (!choice) {
    throw new Error("No completion choice returned from model.");
  }

  // 6. Check finish reason: truncation is treated as failure
  if (choice.finish_reason === "length") {
    const promptTokens = response.usage?.prompt_tokens;
    const completionTokens = response.usage?.completion_tokens;
    const reasoningTokens = (response.usage as unknown as { completion_tokens_details?: { reasoning_tokens?: number } })
      ?.completion_tokens_details?.reasoning_tokens;
    const hasContent = Boolean(choice.message?.content && choice.message.content.trim().length > 0);

    const safeMeta = [
      completionTokens !== undefined ? `completion_tokens: ${completionTokens}` : null,
      reasoningTokens !== undefined ? `reasoning_tokens: ${reasoningTokens}` : null,
      promptTokens !== undefined ? `prompt_tokens: ${promptTokens}` : null,
      `final_content_emitted: ${hasContent}`,
    ]
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Extraction response was truncated by the token limit (${maxTokens} tokens${safeMeta ? `; ${safeMeta}` : ""}) before completion.`
    );
  }

  const rawContent = choice.message?.content;
  if (!rawContent || typeof rawContent !== "string" || rawContent.trim().length === 0) {
    throw new Error("Model returned an empty content response.");
  }

  // 7. Parse JSON safely
  const jsonString = extractCleanJsonString(rawContent);
  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(jsonString);
  } catch {
    throw new Error("Model response could not be parsed as valid JSON.");
  }

  // 8. Validate against Zod ExtractionResultSchema
  const parseResult = ExtractionResultSchema.safeParse(parsedPayload);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Extracted candidates violated schema constraints: ${errorDetails}`);
  }

  const rawCandidates = parseResult.data.candidates;
  let verifiedCount = 0;
  let rejectedCount = 0;

  // 9. Mechanically verify evidence quotations against sourceText
  const verifiedCandidates: VerifiedExtractedCandidate[] = rawCandidates.map(
    (candidate, index) => {
      const verification = verifyEvidence(sourceText, candidate.evidenceQuote);

      if (verification.verified) {
        verifiedCount++;
      } else {
        rejectedCount++;
      }

      return {
        ...candidate,
        id: `extracted-${Date.now()}-${index + 1}`,
        quoteVerified: verification.verified,
        verificationDetails: verification,
      };
    }
  );

  const durationMs = Date.now() - startTime;

  return {
    candidates: verifiedCandidates,
    rawCandidateCount: rawCandidates.length,
    verifiedQuoteCount: verifiedCount,
    rejectedQuoteCount: rejectedCount,
    model: response.model || model,
    durationMs,
  };
}
