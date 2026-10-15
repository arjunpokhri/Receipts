"use client";

import React, { useState } from "react";
import {
  ShieldCheckIcon,
  XCircleIcon,
  SparklesIcon,
  InfoIcon,
} from "./icons";
import { verifyEvidence } from "@/lib/verifier";
import { MECHANICAL_VERIFICATION_DISCLAIMER } from "@/lib/evaluate-extraction";

export function CustomTextVerifier() {
  const [sourceText, setSourceText] = useState(
    `From: Sarah Jenkins <sarah@clientbrand.org>\nDate: Oct 12, 2026, 11:15 AM\nSubject: Mobile navigation feedback\n\nHi Marcus,\n\nWe love the desktop wireframes. For mobile navigation, we agree to proceed with the slide-out menu drawer at the quoted $650 addition.\n\nPlease ensure it is completed by Oct 24th.\n\nBest,\nSarah`
  );

  const [testQuote, setTestQuote] = useState(
    "we agree to proceed with the slide-out menu drawer at the quoted $650 addition"
  );

  const [strictMode, setStrictMode] = useState(false);

  const result = verifyEvidence(sourceText, testQuote, {
    normalizeQuotesAndWhitespace: !strictMode,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border border-[#20251F]/10 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[#20251F]/15 bg-[#F6F5F0] text-[#244D3A]">
            <SparklesIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-[#20251F]">
              Live Mechanical Evidence Verifier
            </h2>
            <p className="text-xs text-[#576356] leading-relaxed mt-0.5">
              Test any quotation directly against raw client text. Validates exact substring match, whitespace variance, and Unicode quotation marks without external API calls.
            </p>
          </div>
        </div>

        <div className="mt-3.5 border border-[#20251F]/15 bg-[#E7EEE8]/50 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#20251F]">
            <InfoIcon className="h-3.5 w-3.5 text-[#244D3A]" />
            <span>Pure Deterministic Tool</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#576356]">
            This tool performs mathematical string matching. <em>It does not call an AI model or present user text as AI-analyzed.</em>
          </p>
        </div>
      </div>

      {/* Editor & Verifier Inputs */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Source Text Input */}
        <div className="border border-[#20251F]/10 bg-white p-4 sm:p-5 shadow-xs">
          <label className="block text-xs font-semibold font-sans text-[#576356] mb-2">
            1. Raw Source Communication (Paste text here)
          </label>
          <textarea
            rows={10}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="w-full border border-[#20251F]/15 bg-white p-3 font-mono text-xs text-[#20251F] focus:border-[#244D3A] focus:outline-hidden"
            placeholder="Paste raw email, Slack transcript, or contract text..."
          />
          <div className="mt-2 text-xs text-[#889386]">
            {sourceText.length} characters • {sourceText.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Candidate Quote Input & Output */}
        <div className="space-y-4">
          <div className="border border-[#20251F]/10 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold font-sans text-[#576356]">
                2. Candidate Quotation to Verify
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#576356] cursor-pointer">
                <input
                  type="checkbox"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  className="rounded-none border-[#20251F]/30 text-[#244D3A] focus:ring-0"
                />
                <span>Strict Verbatim Mode</span>
              </label>
            </div>
            <textarea
              rows={4}
              value={testQuote}
              onChange={(e) => setTestQuote(e.target.value)}
              className="w-full border border-[#20251F]/15 bg-white p-3 font-sans text-xs text-[#20251F] focus:border-[#244D3A] focus:outline-hidden"
              placeholder="Enter quote excerpt to test..."
            />
          </div>

          {/* Real-time Verification Output */}
          <div className="border border-[#20251F]/10 bg-white p-4 sm:p-5 shadow-xs">
            <div className="text-xs font-semibold font-sans text-[#576356] mb-2.5">
              Verifier Result
            </div>

            {result.verified ? (
              <div className="border border-[#2E7D5B]/30 bg-[#F0F6F2] p-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#244D3A]">
                  <ShieldCheckIcon className="h-4 w-4 text-[#2E7D5B]" />
                  <span>
                    Verified: {result.exactMatch ? "Exact Substring Match" : "Normalized Whitespace / Quote Match"}
                  </span>
                </div>
                <div className="mt-1.5 font-mono text-xs text-[#244D3A]">
                  Span indices: [{result.startIndex} ... {result.endIndex}]
                </div>
                <div className="mt-2 border-t border-[#2E7D5B]/20 pt-1.5 text-xs text-[#20251F]">
                  Matched snippet: &quot;{result.matchedText}&quot;
                </div>
              </div>
            ) : (
              <div className="border border-[#C95C4B]/30 bg-[#FDF2F0] p-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#A83827]">
                  <XCircleIcon className="h-4 w-4 text-[#C95C4B]" />
                  <span>Verification Rejected: {result.reason}</span>
                </div>
                <p className="mt-1.5 text-xs text-[#576356]">
                  {result.message}
                </p>
              </div>
            )}

            <div className="mt-3 text-[11px] text-[#889386] leading-relaxed">
              {MECHANICAL_VERIFICATION_DISCLAIMER}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
