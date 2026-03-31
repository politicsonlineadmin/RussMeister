import { NextRequest, NextResponse } from 'next/server';
import type { CEFRLevel, SpeakingFeedback } from '@/types';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { cefrToNumber } from '@/lib/utils';
import { getRequiredEnv } from '@/lib/env';

// ─── Constants ────────────────────────────────────────────────
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;
const VALID_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const SYSTEM_PROMPT = `You are RussMeister, an expert Russian language tutor powered by AI. You specialize in assessing spoken Russian and providing constructive, encouraging feedback tailored to the learner's CEFR level.

Core principles:
- Be encouraging but honest about errors
- For A1/A2: Focus on the most important corrections only, celebrate any attempt
- For B1/B2: Provide more detailed feedback on grammar and vocabulary
- For C1/C2: Give nuanced feedback on fluency, register, and idiomatic usage
- Always provide a corrected version of what the learner said
- Provide feedback on Russian pronunciation challenges like palatalization, stress patterns, and vowel reduction
- Always respond with valid JSON matching the requested schema exactly`;

// ─── Helpers ──────────────────────────────────────────────────
function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim().slice(0, 5000);
}

// ─── Route Handler ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip') ?? 'unknown';
  const rl = checkRateLimit(ip, 20);
  const rlHeaders = rateLimitHeaders(rl);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    const body = await request.json();
    const { target_phrase, transcript, confidence, level, domain } = body;

    // ── Input validation ──
    if (!target_phrase || typeof target_phrase !== 'string') {
      return NextResponse.json(
        { error: 'target_phrase is required and must be a string' },
        { status: 400, headers: rlHeaders }
      );
    }
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'transcript is required and must be a string' },
        { status: 400, headers: rlHeaders }
      );
    }
    if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
      return NextResponse.json(
        { error: 'confidence must be a number between 0 and 1' },
        { status: 400, headers: rlHeaders }
      );
    }
    if (!VALID_LEVELS.includes(level)) {
      return NextResponse.json(
        { error: `Invalid CEFR level. Must be one of: ${VALID_LEVELS.join(', ')}` },
        { status: 400, headers: rlHeaders }
      );
    }
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'domain is required and must be a string' },
        { status: 400, headers: rlHeaders }
      );
    }

    const sanitizedTarget = sanitize(target_phrase);
    const sanitizedTranscript = sanitize(transcript);
    const sanitizedDomain = sanitize(domain);

    const prompt = `Assess this Russian speaking attempt:

Target phrase: "${sanitizedTarget}"
Learner's transcript (from speech recognition): "${sanitizedTranscript}"
Speech recognition confidence: ${confidence.toFixed(2)}
Learner's CEFR level: ${level}
Interest domain: ${sanitizedDomain}

Consider that speech recognition may have errors. A low confidence score (below 0.7) may indicate unclear pronunciation or speech recognition limitations rather than learner error.

${cefrToNumber(level) <= cefrToNumber('A2')
  ? 'This is a beginner learner. Be very encouraging. Focus on what they got right. Limit critical feedback to the single most important improvement.'
  : cefrToNumber(level) <= cefrToNumber('B2')
    ? 'This is an intermediate learner. Provide balanced feedback with specific grammar and vocabulary suggestions.'
    : 'This is an advanced learner. Provide detailed feedback on fluency, register, and idiomatic accuracy.'}

Respond with ONLY a JSON object matching this schema:
{
  "overall_score": number (1-10),
  "pronunciation_feedback": string (specific feedback on pronunciation),
  "grammar_feedback": string (feedback on grammatical accuracy),
  "vocabulary_feedback": string (feedback on word choice and vocabulary usage),
  "what_they_did_well": string (positive reinforcement),
  "what_to_improve": string (constructive suggestions),
  "corrected_version": string (the correct Russian version of what they tried to say),
  "encouragement": string (motivating message appropriate to their level)
}

Return ONLY valid JSON, no additional text.`;

    const apiKey = getRequiredEnv('ANTHROPIC_API_KEY');

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find(
      (block: { type: string }) => block.type === 'text'
    );
    if (!textBlock?.text) {
      throw new Error('No text content in Anthropic API response');
    }

    // Parse and validate the response
    const raw = textBlock.text as string;
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
    const feedback: SpeakingFeedback = JSON.parse(jsonStr);

    // Validate required fields
    if (
      typeof feedback.overall_score !== 'number' ||
      typeof feedback.pronunciation_feedback !== 'string' ||
      typeof feedback.grammar_feedback !== 'string' ||
      typeof feedback.vocabulary_feedback !== 'string' ||
      typeof feedback.what_they_did_well !== 'string' ||
      typeof feedback.what_to_improve !== 'string' ||
      typeof feedback.corrected_version !== 'string' ||
      typeof feedback.encouragement !== 'string'
    ) {
      throw new Error('Invalid response structure from AI');
    }

    // Clamp score
    feedback.overall_score = Math.max(1, Math.min(10, Math.round(feedback.overall_score)));

    return NextResponse.json(
      { success: true, data: feedback },
      { status: 200, headers: rlHeaders }
    );
  } catch (error) {
    console.error('Speaking assessment error:', error);
    const isConfig = error instanceof Error && error.message.includes('not configured');

    return NextResponse.json(
      { error: isConfig ? 'Service temporarily unavailable' : 'An error occurred processing your request' },
      { status: isConfig ? 503 : 500, headers: rlHeaders }
    );
  }
}
