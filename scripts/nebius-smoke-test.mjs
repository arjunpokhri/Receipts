#!/usr/bin/env node

/**
 * Temporary Nebius Token Factory API Smoke Test
 *
 * Purpose:
 *   Verifies connectivity, authentication, and structured JSON generation
 *   from Nebius Token Factory using configuration in .env.local.
 *
 * Safety & Privacy Safeguards:
 *   - NEVER prints or logs API keys, auth headers, or raw response objects.
 *   - Reads .env.local securely via Node.js filesystem APIs.
 *   - Treats finish_reason === "length" as an incomplete response / failure.
 *   - Parses final response as JSON and verifies {"status":"ok"}.
 *   - Uses supported response_format: { type: "json_object" } to encourage structured JSON.
 *   - Classifies errors into diagnostic categories.
 */

import fs from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';

// 1. Securely parse .env.local without exposing secrets
function loadEnvLocal(envFilePath) {
  const env = {};
  if (!fs.existsSync(envFilePath)) {
    return env;
  }

  const content = fs.readFileSync(envFilePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();

    // Strip wrapping quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

// 2. Sanitize strings to avoid accidental secret leakage or multi-line dumping
function sanitize(str, maxLen = 150) {
  if (typeof str !== 'string') return '';
  const cleaned = str.replace(/[\r\n]+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen) + '... (truncated)';
}

// 3. Robust JSON extraction and validation
function extractAndValidateJson(content) {
  if (!content || typeof content !== 'string') {
    return {
      valid: false,
      reason: 'Empty content',
      diagnostic: 'The model returned empty message content.',
    };
  }

  let textToParse = content.trim();

  // If the model produced thought/thinking tags, isolate the candidate final answer
  let hadThinkingTags = false;
  if (textToParse.includes('<think>')) {
    hadThinkingTags = true;
    const thinkEndIdx = textToParse.indexOf('</think>');
    if (thinkEndIdx !== -1) {
      textToParse = textToParse.slice(thinkEndIdx + '</think>'.length).trim();
    } else {
      return {
        valid: false,
        reason: 'Incomplete thinking block',
        diagnostic: 'The response contains an unclosed <think> block with no final answer.',
      };
    }
  }

  // If nothing remains after removing thinking tags, it was reasoning-only
  if (!textToParse) {
    return {
      valid: false,
      reason: 'Reasoning-only response',
      diagnostic: 'The response contained only thinking/reasoning without a final JSON object.',
    };
  }

  // Strip markdown code fences if present (e.g. ```json ... ```)
  const fenceMatch = textToParse.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    textToParse = fenceMatch[1].trim();
  }

  // Attempt strict JSON parsing
  let parsed;
  try {
    parsed = JSON.parse(textToParse);
  } catch {
    return {
      valid: false,
      reason: 'Invalid JSON',
      diagnostic: 'Failed to parse response as JSON. Output did not conform to JSON structure.',
      excerpt: sanitize(textToParse, 120),
    };
  }

  // Verify that it is a plain JSON object
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      reason: 'Non-object JSON',
      diagnostic: `Expected a JSON object {"status":"ok"}, but received JSON ${Array.isArray(parsed) ? 'array' : typeof parsed}.`,
    };
  }

  const keys = Object.keys(parsed);
  if (keys.length !== 1 || keys[0] !== 'status' || parsed.status !== 'ok') {
    return {
      valid: false,
      reason: 'JSON content mismatch',
      diagnostic: `Expected {"status":"ok"}, but received keys [${keys.join(', ')}] with status "${parsed.status}".`,
      received: parsed,
    };
  }

  return {
    valid: true,
    hadThinkingTags,
    parsed,
  };
}

async function runSmokeTest() {
  console.log('=== Nebius Token Factory API Smoke Test ===');

  // Locate .env.local relative to repository root
  const rootDir = process.cwd();
  const envPath = path.resolve(rootDir, '.env.local');
  const localEnv = loadEnvLocal(envPath);

  const baseUrl =
    localEnv.NEBIUS_BASE_URL ||
    process.env.NEBIUS_BASE_URL ||
    'https://api.tokenfactory.nebius.com/v1/';

  const apiKey =
    localEnv.NEBIUS_API_KEY ||
    process.env.NEBIUS_API_KEY ||
    '';

  const model =
    localEnv.NEBIUS_MODEL ||
    process.env.NEBIUS_MODEL ||
    'nvidia/Nemotron-3_5-Lightning';

  // Report configuration presence (NEVER secrets)
  console.log('Configuration Check:');
  console.log(`- Base URL:  Present (${baseUrl})`);
  console.log(`- API Key:   ${apiKey ? 'Present (configured)' : 'MISSING'}`);
  console.log(`- Model:     Present (${model})`);

  if (!apiKey) {
    console.log('\nHTTP/API Status: Failure');
    console.log('Diagnostic: Missing NEBIUS_API_KEY in .env.local.');
    console.log('Remediation: Set NEBIUS_API_KEY in .env.local before running the test.');
    process.exit(1);
  }

  // Initialize OpenAI SDK client with configured credentials
  const client = new OpenAI({
    baseURL: baseUrl,
    apiKey: apiKey,
    timeout: 30000, // 30-second timeout
    maxRetries: 0,  // Fail fast for immediate diagnostic
  });

  console.log('\nSending minimal test request:');
  console.log(`- Target Model: ${model}`);
  console.log('- Prompt: System directive + user request for {"status":"ok"}');
  console.log('- Supported Parameter: response_format: { type: "json_object" }');
  console.log('- Max Tokens: 512 (bounded ceiling to prevent premature length truncation)');
  console.log('- Timeout: 30s');

  try {
    const startTime = Date.now();
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an automated health check. Output only a valid JSON object: {"status":"ok"}. Do not include any thinking process, reasoning, explanation, or markdown formatting.',
        },
        {
          role: 'user',
          content: 'Return {"status":"ok"}',
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 512,
      temperature: 0,
    });
    const elapsedMs = Date.now() - startTime;

    const choice = response.choices?.[0];
    const rawContent = choice?.message?.content;
    const finishReason = choice?.finish_reason || 'unknown';
    const returnedModel = response.model || model;

    console.log('\n=== API Response Summary ===');
    console.log(`- HTTP/API Status: Completed (HTTP 200 in ${elapsedMs}ms)`);
    console.log(`- Returned Model Identifier: ${returnedModel}`);
    console.log(`- Finish Reason: ${finishReason}`);

    // Requirement 3: Treat finish_reason === "length" as incomplete / failure
    if (finishReason === 'length') {
      console.log('\nStructured Generation Verification: FAILED');
      console.log('Reason: finish_reason === "length" (incomplete response).');
      console.log('Diagnostic: The token limit was exhausted before the model finished emitting a complete response.');
      if (rawContent) {
        console.log(`- Partial Output Excerpt: "${sanitize(rawContent, 120)}"`);
      }
      process.exit(1);
    }

    if (finishReason !== 'stop') {
      console.log('\nStructured Generation Verification: FAILED');
      console.log(`Reason: Abnormal finish_reason: "${finishReason}" (expected "stop").`);
      console.log('Diagnostic: The model did not complete its generation normally.');
      process.exit(1);
    }

    // Requirement 4: Parse final response content as JSON and verify {"status":"ok"}
    const validation = extractAndValidateJson(rawContent);

    if (!validation.valid) {
      console.log('\nStructured Generation Verification: FAILED');
      console.log(`Reason: ${validation.reason}`);
      console.log(`Diagnostic: ${validation.diagnostic}`);
      if (validation.excerpt) {
        console.log(`- Output Excerpt: "${validation.excerpt}"`);
      } else if (rawContent) {
        console.log(`- Raw Content Excerpt: "${sanitize(rawContent, 120)}"`);
      }
      process.exit(1);
    }

    // Success confirmation
    console.log(`- Model Output Excerpt: "${sanitize(rawContent, 120)}"`);
    console.log('\nStructured Generation Verification: PASSED');
    console.log('Verified Output Payload: {"status":"ok"}');
    if (validation.hadThinkingTags) {
      console.log('Note: The model included <think> tags, but successfully emitted the valid final JSON payload afterwards.');
    } else {
      console.log('Note: Clean structured JSON generation without exposed thinking tags.');
    }
  } catch (error) {
    console.log('\n=== API Call Failed ===');
    console.log('HTTP/API Status: Failure');

    const status = error?.status || error?.statusCode || null;
    const errorType = error?.name || 'Error';
    const sanitizedMsg = sanitize(error?.message || 'Unknown error occurred', 150);

    if (status) {
      console.log(`- HTTP Status Code: ${status}`);
    }
    console.log(`- Error Type: ${errorType}`);
    console.log(`- Message: ${sanitizedMsg}`);

    console.log('\nDiagnostic & Remediation:');
    if (status === 401) {
      console.log('Authentication Error (401): The NEBIUS_API_KEY was rejected by Nebius Token Factory.');
      console.log('Remediation: Verify your API key at https://tokenfactory.nebius.com and update .env.local.');
    } else if (status === 403) {
      console.log('Permission Denied (403): The API key lacks permission or access to this model.');
      console.log('Remediation: Check account status and key permissions in Nebius Token Factory.');
    } else if (status === 404) {
      console.log(`Model / Route Not Found (404): The requested model identifier "${model}" was not recognized, or the endpoint URL is incorrect.`);
      console.log('Remediation: Confirm the exact model identifier in the Nebius Token Factory model catalogue.');
    } else if (status === 429) {
      console.log('Quota / Rate Limit Exceeded (429): Nebius Token Factory rate limits or credit balance have been exhausted.');
      console.log('Remediation: Check account balance and rate limits in the Nebius console.');
    } else if (status === 400) {
      console.log(`Bad Request (400): ${sanitizedMsg}`);
      if (sanitizedMsg.toLowerCase().includes('response_format') || sanitizedMsg.toLowerCase().includes('json')) {
        console.log('Diagnostic: The model or endpoint does not support response_format: {"type":"json_object"}.');
      }
    } else if (
      errorType === 'APIConnectionTimeoutError' ||
      error?.code === 'ETIMEDOUT' ||
      error?.message?.includes('timeout')
    ) {
      console.log('Timeout Error: The request to Nebius Token Factory timed out after 30 seconds.');
      console.log('Remediation: Check network stability or verify if the Nebius service is experiencing delays.');
    } else if (
      errorType === 'APIConnectionError' ||
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ECONNREFUSED'
    ) {
      console.log(`Connection Error: Unable to establish a network connection to ${baseUrl}.`);
      console.log('Remediation: Verify your internet connection, DNS resolution, and that the base URL is reachable.');
    } else {
      console.log(`General API Error (${status || 'Unknown'}): An unexpected error occurred while communicating with Nebius.`);
      console.log('Remediation: Review the message above and verify endpoint compatibility.');
    }

    process.exit(1);
  }
}

runSmokeTest();
