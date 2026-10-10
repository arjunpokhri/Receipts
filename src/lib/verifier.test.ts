import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  verifyEvidence,
  normalizeQuotes,
  collapseWhitespace,
  normalizeForLenientMatch,
} from "./verifier.ts";

describe("Deterministic Evidence Verifier", () => {
  const sourceSample = `Hi Arjun,
Thanks for sending over the updated estimate.
We'd love to proceed with the redesign phase for $4,500.

Please note that we need the Figma deliverables delivered by next Friday, October 17th.
Regarding revisions: "We agree on up to 2 rounds of design revisions."
Any additional rounds beyond that will be billed at $120/hr.

Let me know if this works for you!
Best,
Sarah`;

  describe("Helper Normalizers", () => {
    it("normalizes diverse Unicode quotes to ASCII", () => {
      const curlySingle = "‘single’ and ’another’ and `tick`";
      const curlyDouble = "“double” and ”another” and «guillemets»";
      assert.equal(normalizeQuotes(curlySingle), "'single' and 'another' and 'tick'");
      assert.equal(normalizeQuotes(curlyDouble), '"double" and "another" and "guillemets"');
    });

    it("collapses multi-character whitespace and newlines to single space", () => {
      const messy = "Hello \t \n\n world!   Multiple   spaces.";
      assert.equal(collapseWhitespace(messy), "Hello world! Multiple spaces.");
    });

    it("normalizes text for lenient comparison", () => {
      const input = "“We   agree\n\ton  2   rounds”";
      assert.equal(normalizeForLenientMatch(input), '"We agree on 2 rounds"');
    });
  });

  describe("Exact Quotation Verification", () => {
    it("verifies exact verbatim substring matches", () => {
      const quote = "We'd love to proceed with the redesign phase for $4,500.";
      const result = verifyEvidence(sourceSample, quote);

      assert.equal(result.verified, true);
      if (result.verified) {
        assert.equal(result.exactMatch, true);
        assert.equal(result.matchedText, quote);
        assert.equal(sourceSample.slice(result.startIndex, result.endIndex), quote);
      }
    });

    it("verifies quotes with leading/trailing whitespace after trimming", () => {
      const quote = "  \n  Any additional rounds beyond that will be billed at $120/hr.  \t ";
      const expected = "Any additional rounds beyond that will be billed at $120/hr.";
      const result = verifyEvidence(sourceSample, quote);

      assert.equal(result.verified, true);
      if (result.verified) {
        assert.equal(result.matchedText, expected);
      }
    });
  });

  describe("Whitespace & Line Break Variance", () => {
    it("verifies quotes spanning newlines in source text", () => {
      const quoteAcrossNewlines =
        "Figma deliverables delivered by next Friday, October 17th. Regarding revisions:";
      const result = verifyEvidence(sourceSample, quoteAcrossNewlines);

      assert.equal(result.verified, true);
      if (result.verified) {
        assert.equal(result.exactMatch, false);
        assert.match(result.matchedText, /\n/);
      }
    });

    it("verifies quotes with multi-spaces or tabs in quote string", () => {
      const messyQuote = "proceed   with \t the   redesign   phase   for $4,500.";
      const result = verifyEvidence(sourceSample, messyQuote);

      assert.equal(result.verified, true);
      if (result.verified) {
        assert.equal(result.exactMatch, false);
        assert.equal(
          result.matchedText,
          "proceed with the redesign phase for $4,500."
        );
      }
    });
  });

  describe("Unicode & Curly Quotation Marks", () => {
    it("verifies ASCII quote matching source text containing curly double quotes", () => {
      const sourceWithCurly = `Client said: “We agree on up to 2 rounds of design revisions.”`;
      const asciiQuote = `"We agree on up to 2 rounds of design revisions."`;
      const result = verifyEvidence(sourceWithCurly, asciiQuote);

      assert.equal(result.verified, true);
      if (result.verified) {
        assert.equal(result.exactMatch, false);
        assert.equal(result.matchedText, "“We agree on up to 2 rounds of design revisions.”");
      }
    });

    it("verifies curly quote matching source text containing ASCII double quotes", () => {
      const quoteWithCurly = `“We agree on up to 2 rounds of design revisions.”`;
      const result = verifyEvidence(sourceSample, quoteWithCurly);

      assert.equal(result.verified, true);
      if (result.verified) {
        assert.equal(result.matchedText, `"We agree on up to 2 rounds of design revisions."`);
      }
    });

    it("verifies curly apostrophe matching ASCII apostrophe in contractions", () => {
      const quoteWithCurlyApostrophe = "We’d love to proceed";
      const result = verifyEvidence(sourceSample, quoteWithCurlyApostrophe);

      assert.equal(result.verified, true);
      if (result.verified) {
        assert.equal(result.matchedText, "We'd love to proceed");
      }
    });
  });

  describe("Rejections: Missing, Fabricated, and Paraphrased Quotes", () => {
    it("rejects empty quote string with EMPTY_QUOTE reason", () => {
      const result = verifyEvidence(sourceSample, "   \n\t  ");
      assert.equal(result.verified, false);
      if (!result.verified) {
        assert.equal(result.reason, "EMPTY_QUOTE");
      }
    });

    it("rejects empty source document with EMPTY_SOURCE reason", () => {
      const result = verifyEvidence("   ", "Any quote here");
      assert.equal(result.verified, false);
      if (!result.verified) {
        assert.equal(result.reason, "EMPTY_SOURCE");
      }
    });

    it("rejects completely non-existent / fabricated quotations", () => {
      const fabricatedQuote = "We will pay an advance deposit of $10,000 via wire transfer.";
      const result = verifyEvidence(sourceSample, fabricatedQuote);

      assert.equal(result.verified, false);
      if (!result.verified) {
        assert.equal(result.reason, "QUOTE_NOT_FOUND");
      }
    });

    it("rejects paraphrased quotation with changed words (MATERIAL_MISMATCH)", () => {
      // Original is: "We agree on up to 2 rounds of design revisions."
      // Paraphrased changes words: "We agreed to two rounds of design edits."
      const paraphrasedQuote = "We agree on up to two rounds of design revisions.";
      const result = verifyEvidence(sourceSample, paraphrasedQuote);

      assert.equal(result.verified, false);
      if (!result.verified) {
        assert.equal(result.reason, "MATERIAL_MISMATCH");
      }
    });

    it("rejects quotation with materially altered terms or numbers", () => {
      // Changed price from $4,500 to $5,000
      const alteredPriceQuote = "proceed with the redesign phase for $5,000.";
      const result = verifyEvidence(sourceSample, alteredPriceQuote);

      assert.equal(result.verified, false);
      if (!result.verified) {
        assert.equal(result.reason, "MATERIAL_MISMATCH");
      }
    });
  });

  describe("Strict Mode Options", () => {
    it("fails when normalizeQuotesAndWhitespace is false and exact match does not hold", () => {
      const quoteWithCurly = `“We agree on up to 2 rounds of design revisions.”`;
      const result = verifyEvidence(sourceSample, quoteWithCurly, {
        normalizeQuotesAndWhitespace: false,
      });

      assert.equal(result.verified, false);
      if (!result.verified) {
        assert.equal(result.reason, "QUOTE_NOT_FOUND");
      }
    });
  });
});
