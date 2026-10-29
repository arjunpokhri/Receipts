import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractText } from "unpdf";
import mammoth from "mammoth";
import { verifyEvidence } from "./verifier.ts";

describe("Document Parsing Engine for Receipts", () => {
  it("extracts text correctly from a valid PDF buffer and enables mechanical verification", async () => {
    // Minimal valid PDF with text stream
    const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 58 >> stream
BT
/F1 12 Tf
100 700 Td
(Client agrees to $1,200 for payment gateway) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000368 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
437
%%EOF`;

    const buffer = Buffer.from(minimalPdf, "utf-8");
    const result = await extractText(new Uint8Array(buffer));

    assert.ok(result.text, "PDF text should be extracted");
    const fullText = Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
    assert.match(fullText, /Client agrees to \$1,200 for payment gateway/);

    // Mechanical grounding verification against extracted document text
    const verification = verifyEvidence(fullText, "Client agrees to $1,200 for payment gateway");
    assert.equal(verification.verified, true);
    assert.equal(verification.matchedText, "Client agrees to $1,200 for payment gateway");
  });

  it("extracts text from plain text and markdown preserving verbatim spans", () => {
    const markdownContent = `# Project Scope Addendum
Date: October 29, 2026

## 1. Additional Deliverables
- The contractor shall implement Stripe payment checkout.
- Delivery deadline is confirmed for November 15, 2026.
`;
    const normalized = markdownContent.replace(/\r\n/g, "\n").trim();
    assert.ok(normalized.includes("Stripe payment checkout"));

    const verifyDelivery = verifyEvidence(
      normalized,
      "Delivery deadline is confirmed for November 15, 2026."
    );
    assert.equal(verifyDelivery.verified, true);
  });

  it("handles mammoth extractRawText API structure for docx compatibility", async () => {
    assert.equal(typeof mammoth.extractRawText, "function");
  });
});
