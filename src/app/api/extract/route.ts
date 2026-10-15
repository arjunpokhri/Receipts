import { NextRequest, NextResponse } from "next/server";
import { extractCommitmentsWithNebius } from "@/lib/nebius-extraction";

// Sensible maximum character limit for source communication (approx. 6,000–8,000 words)
const MAX_SOURCE_LENGTH = 30000;
const MAX_CONTEXT_LENGTH = 2000;

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 }
      );
    }

    const { sourceText, projectContext } = body as {
      sourceText?: unknown;
      projectContext?: unknown;
    };

    // 1. Source text validation
    if (typeof sourceText !== "string" || sourceText.trim().length === 0) {
      return NextResponse.json(
        { error: "sourceText is required and must not be empty." },
        { status: 400 }
      );
    }

    const trimmedSource = sourceText.trim();
    if (trimmedSource.length > MAX_SOURCE_LENGTH) {
      return NextResponse.json(
        {
          error: `Source text exceeds maximum allowed limit of ${MAX_SOURCE_LENGTH.toLocaleString()} characters.`,
        },
        { status: 400 }
      );
    }

    // 2. Project context validation
    let validContext: string | undefined;
    if (projectContext !== undefined && projectContext !== null) {
      if (typeof projectContext !== "string") {
        return NextResponse.json(
          { error: "projectContext must be a string if provided." },
          { status: 400 }
        );
      }
      validContext = projectContext.trim().slice(0, MAX_CONTEXT_LENGTH);
    }

    // 3. Server-side environment key check
    if (!process.env.NEBIUS_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Nebius API key is not configured on the server. Please verify NEBIUS_API_KEY in .env.local.",
        },
        { status: 503 }
      );
    }

    // 4. Run server-side extraction
    const result = await extractCommitmentsWithNebius(trimmedSource, {
      projectContext: validContext,
      timeoutMs: 45000,
      maxTokens: 4096,
    });

    return NextResponse.json({
      success: true,
      candidates: result.candidates,
      rawCandidateCount: result.rawCandidateCount,
      verifiedQuoteCount: result.verifiedQuoteCount,
      rejectedQuoteCount: result.rejectedQuoteCount,
      model: result.model,
      durationMs: result.durationMs,
    });
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string; status?: number };
    const errMsg = err?.message || "An unexpected error occurred during extraction.";

    // Differentiate user/schema errors from network/timeout errors safely
    if (
      errMsg.includes("schema constraints") ||
      errMsg.includes("could not be parsed as valid JSON") ||
      errMsg.includes("cut off inside a thinking process") ||
      errMsg.includes("truncated by the token limit")
    ) {
      return NextResponse.json(
        { error: errMsg },
        { status: 422 }
      );
    }

    if (
      err?.name === "APIConnectionTimeoutError" ||
      errMsg.includes("timeout") ||
      errMsg.includes("ETIMEDOUT")
    ) {
      return NextResponse.json(
        { error: "The extraction request to the Nebius service timed out after 45 seconds." },
        { status: 504 }
      );
    }

    if (
      err?.name === "APIConnectionError" ||
      err?.name === "AuthenticationError" ||
      err?.name === "PermissionDeniedError" ||
      err?.name === "NotFoundError"
    ) {
      return NextResponse.json(
        { error: `Nebius API service communication error: ${errMsg}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
