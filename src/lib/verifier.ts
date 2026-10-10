export interface VerificationSuccess {
  verified: true;
  exactMatch: boolean;
  matchedText: string;
  startIndex: number;
  endIndex: number;
}

export interface VerificationFailure {
  verified: false;
  reason:
    | "EMPTY_QUOTE"
    | "EMPTY_SOURCE"
    | "QUOTE_NOT_FOUND"
    | "MATERIAL_MISMATCH";
  message: string;
}

export type VerificationResult = VerificationSuccess | VerificationFailure;

export interface VerifyEvidenceOptions {
  /**
   * If true, allows matching across whitespace/newline variations
   * and unicode quotation mark differences (default: true).
   */
  normalizeQuotesAndWhitespace?: boolean;
}

/**
 * Normalizes Unicode quotation marks and apostrophes to standard ASCII characters:
 * - Single quotes / primes: ‘ ’ ‚ ‛ ` ´ ʼ ˈ -> '
 * - Double quotes: “ ” „ ‟ « » -> "
 */
export function normalizeQuotes(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B\u0060\u00B4\u02BC\u02C8]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"');
}

/**
 * Normalizes sequential whitespace characters (spaces, tabs, newlines, non-breaking spaces)
 * into a single standard space.
 */
export function collapseWhitespace(text: string): string {
  return text.replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, " ");
}

/**
 * Performs canonical normalization for lenient matching (normalizes quotes and collapses whitespace).
 */
export function normalizeForLenientMatch(text: string): string {
  return collapseWhitespace(normalizeQuotes(text));
}

/**
 * Escapes characters for use inside a RegExp pattern.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Constructs a regular expression that matches the quote tokens in sequence,
 * allowing flexible whitespace/newlines and Unicode quote equivalents between tokens,
 * without allowing words or punctuation to materially differ.
 */
function buildLenientRegex(quote: string): RegExp | null {
  const normalized = normalizeQuotes(quote.trim());
  if (!normalized) return null;

  // Split on whitespace into word/punctuation tokens
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const quoteMap: Record<string, string> = {
    "'": "['\u2018\u2019\u201A\u201B\u0060\u00B4\u02BC\u02C8]",
    '"': '["\u201C\u201D\u201E\u201F\u00AB\u00BB]',
  };

  const patternParts = tokens.map((token) => {
    // Replace ASCII quotes in token with regex character class allowing both ASCII and Unicode quotes
    let tokenRegex = "";
    for (const char of token) {
      if (char === "'") {
        tokenRegex += quoteMap["'"];
      } else if (char === '"') {
        tokenRegex += quoteMap['"'];
      } else {
        tokenRegex += escapeRegExp(char);
      }
    }
    return tokenRegex;
  });

  // Join tokens allowing any whitespace sequence (spaces, tabs, newlines, nbsp)
  const pattern = patternParts.join("[\\s\\u00A0\\u2000-\\u200B\\u202F\\u205F\\u3000]+");
  return new RegExp(pattern);
}

/**
 * Verifies whether a quotation extracted from client communications is present in the source text.
 *
 * 1. Checks for exact verbatim substring match first.
 * 2. If not found and normalization is enabled, checks for matching text where only whitespace,
 *    line breaks, or Unicode quotation marks differ.
 * 3. Rejects fabricated, paraphrased, or materially altered quotes.
 */
export function verifyEvidence(
  sourceText: string,
  quoteText: string,
  options: VerifyEvidenceOptions = {}
): VerificationResult {
  const { normalizeQuotesAndWhitespace = true } = options;

  if (!quoteText || quoteText.trim().length === 0) {
    return {
      verified: false,
      reason: "EMPTY_QUOTE",
      message: "The quotation string is empty.",
    };
  }

  if (!sourceText || sourceText.trim().length === 0) {
    return {
      verified: false,
      reason: "EMPTY_SOURCE",
      message: "The source document text is empty.",
    };
  }

  const trimmedQuote = quoteText.trim();

  // 1. Fast path: Exact verbatim substring check
  const exactIndex = sourceText.indexOf(trimmedQuote);
  if (exactIndex !== -1) {
    return {
      verified: true,
      exactMatch: true,
      matchedText: trimmedQuote,
      startIndex: exactIndex,
      endIndex: exactIndex + trimmedQuote.length,
    };
  }

  // If normalization is disabled, fail immediately since exact match failed
  if (!normalizeQuotesAndWhitespace) {
    return {
      verified: false,
      reason: "QUOTE_NOT_FOUND",
      message: "Quotation was not found verbatim in source text.",
    };
  }

  // 2. Lenient regex check to find the exact span in sourceText allowing whitespace/quote variance
  const regex = buildLenientRegex(trimmedQuote);
  if (regex) {
    const match = regex.exec(sourceText);
    if (match && match.index !== undefined) {
      const matchedSnippet = match[0];
      return {
        verified: true,
        exactMatch: false,
        matchedText: matchedSnippet,
        startIndex: match.index,
        endIndex: match.index + matchedSnippet.length,
      };
    }
  }

  // 3. Detailed diagnostics: check if words appear in source in different phrasing/material difference
  const quoteWords = collapseWhitespace(trimmedQuote).split(" ");
  const foundWords = quoteWords.filter((w) => sourceText.includes(w));
  const overlapRatio = quoteWords.length > 0 ? foundWords.length / quoteWords.length : 0;

  if (overlapRatio > 0.6) {
    return {
      verified: false,
      reason: "MATERIAL_MISMATCH",
      message:
        "Quotation appears paraphrased, reordered, or materially altered from the source text.",
    };
  }

  return {
    verified: false,
    reason: "QUOTE_NOT_FOUND",
    message: "Quotation could not be located anywhere in the source text.",
  };
}
