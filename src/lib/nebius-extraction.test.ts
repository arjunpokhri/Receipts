import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractCleanJsonString,
  extractCommitmentsWithNebius,
} from "./nebius-extraction.ts";
import type OpenAI from "openai";

describe("Nebius Extraction Engine", () => {
  describe("extractCleanJsonString helper", () => {
    it("parses pure JSON string without modification", () => {
      const input = '{"candidates": []}';
      assert.equal(extractCleanJsonString(input), '{"candidates": []}');
    });

    it("strips markdown code fences", () => {
      const input = '```json\n{"candidates": []}\n```';
      assert.equal(extractCleanJsonString(input), '{"candidates": []}');
    });

    it("isolates content after </think> reasoning tags", () => {
      const input = '<think>\nThinking about commitments...\n</think>\n{"candidates": []}';
      assert.equal(extractCleanJsonString(input), '{"candidates": []}');
    });

    it("throws when <think> tag is unclosed", () => {
      const input = '<think>\nThinking about commitments...';
      assert.throws(() => extractCleanJsonString(input), {
        message: /cut off inside a thinking process/,
      });
    });
  });

  describe("extractCommitmentsWithNebius (Mocked)", () => {
    const sampleSource =
      "Hi Marcus, we agreed on 3 wireframes for $3,500 by October 17th. " +
      "Could we also add an interactive 3D viewer? Best, Elena.";

    it("successfully extracts and verifies candidates with valid source quotes", async () => {
      const mockClient = {
        chat: {
          completions: {
            create: async () => ({
              id: "mock-cmpl-1",
              model: "nvidia/Nemotron-3_5-Lightning",
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    role: "assistant",
                    content: JSON.stringify({
                      candidates: [
                        {
                          claim: "Agreed on 3 wireframes for $3,500",
                          evidenceQuote: "agreed on 3 wireframes for $3,500",
                          speaker: "Elena",
                          timestamp: "Kickoff",
                          commitmentType: "deliverables",
                          speechAct: "commitment",
                          suggestedStatus: "baseline",
                          confidence: "high",
                          explanation: "Original scope agreed by client.",
                        },
                        {
                          claim: "Client requests an interactive 3D viewer",
                          evidenceQuote: "Could we also add an interactive 3D viewer?",
                          speaker: "Elena",
                          timestamp: "Kickoff",
                          commitmentType: "deliverables",
                          speechAct: "request",
                          suggestedStatus: "proposed",
                          confidence: "medium",
                          explanation: "Feature request beyond initial scope.",
                        },
                      ],
                    }),
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      const result = await extractCommitmentsWithNebius(sampleSource, {
        client: mockClient,
      });

      assert.equal(result.rawCandidateCount, 2);
      assert.equal(result.verifiedQuoteCount, 2);
      assert.equal(result.rejectedQuoteCount, 0);
      assert.equal(result.candidates.length, 2);

      // Verify all candidates have verified quotes and valid suggestedStatus
      for (const cand of result.candidates) {
        assert.equal(cand.quoteVerified, true);
        assert.equal(cand.verificationDetails.verified, true);
        assert.ok(["baseline", "proposed", "unclear"].includes(cand.suggestedStatus));
      }
    });

    it("flags fabricated quotations as quoteVerified: false without crashing", async () => {
      const mockClient = {
        chat: {
          completions: {
            create: async () => ({
              id: "mock-cmpl-2",
              model: "nvidia/Nemotron-3_5-Lightning",
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    role: "assistant",
                    content: JSON.stringify({
                      candidates: [
                        {
                          claim: "Contractor guaranteed lifetime free revisions",
                          evidenceQuote: "we promise free revisions forever with no extra charge",
                          speaker: "Marcus",
                          timestamp: "Unknown",
                          commitmentType: "revision_limits",
                          speechAct: "commitment",
                          suggestedStatus: "proposed",
                          confidence: "low",
                          explanation: "Fabricated clause not in email.",
                        },
                      ],
                    }),
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      const result = await extractCommitmentsWithNebius(sampleSource, {
        client: mockClient,
      });

      assert.equal(result.rawCandidateCount, 1);
      assert.equal(result.verifiedQuoteCount, 0);
      assert.equal(result.rejectedQuoteCount, 1);
      assert.equal(result.candidates[0].quoteVerified, false);
      assert.equal(result.candidates[0].verificationDetails.verified, false);
      assert.equal(result.candidates[0].verificationDetails.reason, "QUOTE_NOT_FOUND");
    });

    it("rejects candidate when model attempts to output forbidden terminal status 'confirmed'", async () => {
      const mockClient = {
        chat: {
          completions: {
            create: async () => ({
              id: "mock-cmpl-3",
              model: "nvidia/Nemotron-3_5-Lightning",
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    role: "assistant",
                    content: JSON.stringify({
                      candidates: [
                        {
                          claim: "3 wireframes",
                          evidenceQuote: "agreed on 3 wireframes",
                          speaker: "Elena",
                          timestamp: "Kickoff",
                          commitmentType: "deliverables",
                          speechAct: "commitment",
                          suggestedStatus: "confirmed", // FORBIDDEN by schema!
                          confidence: "high",
                          explanation: "Autonomous confirmation attempt",
                        },
                      ],
                    }),
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      await assert.rejects(
        async () => {
          await extractCommitmentsWithNebius(sampleSource, {
            client: mockClient,
          });
        },
        {
          message: /violated schema constraints/,
        }
      );
    });

    it("rejects when model returns malformed non-JSON text", async () => {
      const mockClient = {
        chat: {
          completions: {
            create: async () => ({
              id: "mock-cmpl-4",
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    role: "assistant",
                    content: "I parsed your text and found some commitments: 3 wireframes for $3,500.",
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      await assert.rejects(
        async () => {
          await extractCommitmentsWithNebius(sampleSource, {
            client: mockClient,
          });
        },
        {
          message: /could not be parsed as valid JSON/,
        }
      );
    });

    it("rejects when model output is cut off by token limit (finish_reason === 'length')", async () => {
      const mockClient = {
        chat: {
          completions: {
            create: async () => ({
              id: "mock-cmpl-5",
              choices: [
                {
                  finish_reason: "length",
                  message: {
                    role: "assistant",
                    content: '{"candidates":[{"claim":"Incomplete',
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      await assert.rejects(
        async () => {
          await extractCommitmentsWithNebius(sampleSource, {
            client: mockClient,
          });
        },
        {
          message: /truncated by the token limit \(4096 tokens.*final_content_emitted: true\) before completion/,
        }
      );
    });

    it("passes bounded default max_tokens (4096), disables thinking by default, and respects overrides", async () => {
      const capturedParams: Array<{
        max_tokens?: number;
        chat_template_kwargs?: { enable_thinking?: boolean };
      }> = [];
      const mockClient = {
        chat: {
          completions: {
            create: async (params: Record<string, unknown>) => {
              capturedParams.push(params as unknown as {
                max_tokens?: number;
                chat_template_kwargs?: { enable_thinking?: boolean };
              });
              return {
                id: "mock-cmpl-params",
                model: "nvidia/Nemotron-3_5-Lightning",
                choices: [
                  {
                    finish_reason: "stop",
                    message: {
                      role: "assistant",
                      content: '{"candidates":[]}',
                    },
                  },
                ],
              };
            },
          },
        },
      } as unknown as OpenAI;

      // Default run (enable_thinking: false)
      await extractCommitmentsWithNebius(sampleSource, { client: mockClient });
      assert.equal(capturedParams[0]?.max_tokens, 4096);
      assert.deepEqual(capturedParams[0]?.chat_template_kwargs, { enable_thinking: false });

      // Override run (maxTokens & enableThinking: true)
      await extractCommitmentsWithNebius(sampleSource, {
        client: mockClient,
        maxTokens: 2048,
        enableThinking: true,
      });
      assert.equal(capturedParams[1]?.max_tokens, 2048);
      assert.deepEqual(capturedParams[1]?.chat_template_kwargs, { enable_thinking: true });
    });

    it("successfully extracts complete JSON when preceded by an extensive reasoning trace in <think> tags", async () => {
      const mockClient = {
        chat: {
          completions: {
            create: async () => ({
              id: "mock-cmpl-reasoning",
              model: "nvidia/Nemotron-3_5-Lightning",
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    role: "assistant",
                    content:
                      "<think>\n" +
                      "Step 1: Analyze client communication from Elena.\n" +
                      "Step 2: Identify deliverables: 3 wireframes for $3,500 by Oct 17.\n" +
                      "Step 3: Identify feature request: interactive 3D viewer.\n" +
                      "Step 4: Format as JSON candidates matching ExtractionResultSchema.\n" +
                      "</think>\n" +
                      JSON.stringify({
                        candidates: [
                          {
                            claim: "3 wireframes for $3,500",
                            evidenceQuote: "agreed on 3 wireframes for $3,500",
                            speaker: "Elena",
                            timestamp: "Kickoff",
                            commitmentType: "deliverables",
                            speechAct: "commitment",
                            suggestedStatus: "baseline",
                            confidence: "high",
                            explanation: "Agreed kickoff scope.",
                          },
                        ],
                      }),
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      const result = await extractCommitmentsWithNebius(sampleSource, {
        client: mockClient,
      });

      assert.equal(result.rawCandidateCount, 1);
      assert.equal(result.verifiedQuoteCount, 1);
      assert.equal(result.candidates[0].claim, "3 wireframes for $3,500");
      assert.equal(result.candidates[0].quoteVerified, true);
    });

    it("rejects empty source text immediately without making API calls", async () => {
      let clientCalled = false;
      const mockClient = {
        chat: {
          completions: {
            create: async () => {
              clientCalled = true;
              return {};
            },
          },
        },
      } as unknown as OpenAI;

      await assert.rejects(
        async () => {
          await extractCommitmentsWithNebius("   ", {
            client: mockClient,
          });
        },
        {
          message: /cannot be empty/,
        }
      );

      assert.equal(clientCalled, false);
    });

    it("propagates API connection and timeout errors cleanly", async () => {
      const mockClient = {
        chat: {
          completions: {
            create: async () => {
              const err = new Error("Connection timed out after 30000ms");
              err.name = "APIConnectionTimeoutError";
              throw err;
            },
          },
        },
      } as unknown as OpenAI;

      await assert.rejects(
        async () => {
          await extractCommitmentsWithNebius(sampleSource, {
            client: mockClient,
          });
        },
        {
          name: "APIConnectionTimeoutError",
          message: /Connection timed out/,
        }
      );
    });

    it("invokes onRawContent with raw model output before parsing and captures token usage", async () => {
      const rawPayload = JSON.stringify({
        candidates: [
          {
            claim: "Deliverables include 3 wireframes",
            evidenceQuote: "agreed on 3 wireframes",
            speaker: "Elena",
            timestamp: "Kickoff",
            commitmentType: "deliverables",
            speechAct: "commitment",
            suggestedStatus: "proposed",
            confidence: "high",
            explanation: "Agreed scope",
          },
        ],
      });

      let capturedRaw: string | null = null;
      const mockClient = {
        chat: {
          completions: {
            create: async () => ({
              id: "mock-usage-1",
              model: "nvidia/Nemotron-3_5-Lightning",
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    role: "assistant",
                    content: rawPayload,
                  },
                },
              ],
              usage: {
                prompt_tokens: 150,
                completion_tokens: 65,
                total_tokens: 215,
              },
            }),
          },
        },
      } as unknown as OpenAI;

      const result = await extractCommitmentsWithNebius(sampleSource, {
        client: mockClient,
        onRawContent: (raw) => {
          capturedRaw = raw;
        },
      });

      assert.equal(capturedRaw, rawPayload);
      assert.equal(result.candidates.length, 1);
      assert.deepEqual(result.usage, {
        promptTokens: 150,
        completionTokens: 65,
        totalTokens: 215,
      });
    });

    it("invokes onRawContent even when schema validation subsequently throws", async () => {
      const invalidSchemaPayload = JSON.stringify({
        candidates: [
          {
            claim: "Unlawful status attempt",
            evidenceQuote: "agreed on 3 wireframes",
            speaker: "Elena",
            timestamp: "Kickoff",
            commitmentType: "deliverables",
            speechAct: "commitment",
            suggestedStatus: "confirmed", // Forbidden terminal status!
            confidence: "high",
            explanation: "Invalid status",
          },
        ],
      });

      let capturedRaw: string | null = null;
      const mockClient = {
        chat: {
          completions: {
            create: async () => ({
              id: "mock-invalid-schema",
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    role: "assistant",
                    content: invalidSchemaPayload,
                  },
                },
              ],
            }),
          },
        },
      } as unknown as OpenAI;

      await assert.rejects(
        async () => {
          await extractCommitmentsWithNebius(sampleSource, {
            client: mockClient,
            onRawContent: (raw) => {
              capturedRaw = raw;
            },
          });
        },
        {
          message: /violated schema constraints/,
        }
      );

      assert.equal(capturedRaw, invalidSchemaPayload);
    });
  });
});
