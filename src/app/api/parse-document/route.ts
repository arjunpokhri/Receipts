import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import mammoth from "mammoth";

// Max file size: 10MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Please attach a PDF, DOCX, DOC, MD, or TXT file." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: `File "${file.name}" is empty.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds the 10MB limit (uploaded: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(1)}MB).`,
        },
        { status: 413 }
      );
    }

    const fileName = file.name || "document";
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
    let extractedText = "";

    if (ext === ".pdf" || file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfData = await extractText(new Uint8Array(arrayBuffer));
        const pages = Array.isArray(pdfData.text)
          ? pdfData.text
          : [pdfData.text || ""];
        extractedText = pages
          .map((p) => p.trim())
          .filter(Boolean)
          .join("\n\n");
      } catch (pdfErr) {
        return NextResponse.json(
          {
            error: `Failed to extract text from PDF: ${
              pdfErr instanceof Error ? pdfErr.message : "Unreadable PDF"
            }`,
          },
          { status: 422 }
        );
      }
    } else if (
      ext === ".docx" ||
      ext === ".doc" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value.trim();
      } catch (docErr) {
        return NextResponse.json(
          {
            error: `Failed to extract text from Word document: ${
              docErr instanceof Error ? docErr.message : "Unreadable DOCX"
            }`,
          },
          { status: 422 }
        );
      }
    } else if (
      ext === ".md" ||
      ext === ".markdown" ||
      ext === ".txt" ||
      ext === ".rtf" ||
      ext === ".csv" ||
      ext === ".tsv" ||
      file.type.startsWith("text/")
    ) {
      try {
        extractedText = (await file.text()).trim();
      } catch (textErr) {
        return NextResponse.json(
          {
            error: `Failed to read text file: ${
              textErr instanceof Error ? textErr.message : "Encoding error"
            }`,
          },
          { status: 422 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error: `Unsupported file format "${ext}". Please upload a .pdf, .docx, .doc, .md, or .txt file.`,
        },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          error: `No readable text could be extracted from "${fileName}". If this is a scanned image or empty document, please paste the text directly.`,
        },
        { status: 422 }
      );
    }

    // Clean up carriage returns (\r\n -> \n) for consistent cross-platform offsets
    const normalizedText = extractedText.replace(/\r\n/g, "\n");
    const words = normalizedText.split(/\s+/).filter(Boolean);

    return NextResponse.json({
      success: true,
      filename: fileName,
      fileSize: file.size,
      text: normalizedText,
      charCount: normalizedText.length,
      wordCount: words.length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected error during document parsing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
