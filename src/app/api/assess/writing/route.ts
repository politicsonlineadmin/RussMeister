import { NextRequest, NextResponse } from 'next/server';
import type { CEFRLevel, WritingFeedback } from '@/types';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { cefrToNumber } from '@/lib/utils';
import { getRequiredEnv } from '@/lib/env';

// ─── Constants ────────────────────────────────────────────────
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 3072;
const VALID_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const BEGINNER_MAX_ERRORS = 3;

const SYSTEM_PROMPT = `You are RussMeister, an expert Russian language tutor powered by AI. You specialize in assessing written Russian and providing constructive, encouraging feedback tailored to the learner's CEFR level.

Core principles:
- Be encouraging but honest about errors
- For A1/A2 beginners: Show a MAXIMUM of 3 errors to avoid overwhelming them. Pick the most important ones.
- For B1/B2: Provide thorough feedback on grammar, vocabulary, and coherence
- For C1/C2: Give detailed feedback on style, register, coherence, and sophistication
- Always provide a model answer showing how the text could be improved
- Classify each error by type: grammar, vocabulary, spelling, word_order, case, or conjugation
- Always respond with valid JSON matching the requested schema exactly`;

// ─── Helpers ──────────────────────────────────────────────────
function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim().slice(0, 10000);
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
    const { task_description, learner_text, level, domain } = body;

    // ── Input validation ──
    if (!task_description || typeof task_description !== 'string') {
      return NextResponse.json(
        { error: 'task_description is required and must be a string' },
        { status: 400, headers: rlHeaders }
      );
    }
    if (!learner_text || typeof learner_text !== 'string') {
      return NextResponse.json(
        { error: 'learner_text is required and must be a string' },
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

    const isBeginner = level === 'A1' || level === 'A2';

    const sanitizedTask = sanitize(task_description);
    const sanitizedText = sanitize(learner_text);
    const sanitizedDomain = sanitize(domain);

    const prompt = `Assess this Russian writing submission:

Task description: "${sanitizedTask}"
Learner's text: "${sanitizedText}"
Learner's CEFR level: ${level}
Interest domain: ${sanitizedDomain}

${isBeginner
  ? `IMPORTANT: This is a beginner (${level}). Return a MAXIMUM of ${BEGINNER_MAX_ERRORS} errors. Pick only the most important ones. Be very encouraging.`
  : cefrToNumber(level) <= cefrToNumber('B2')
    ? 'This is an intermediate learner. Provide thorough but manageable feedback.'
    : 'This is an advanced learner. Provide comprehensive, detailed feedback on all aspects including style and register.'}

Assess the writing across these dimensions (score each 1-10):
1. Grammatical accuracy
2. Vocabulary range and appropriateness
3. Coherence and organization
4. Task completion (did they address the prompt adequately?)

Respond with ONLY a JSON object matching this schema:
{
  "overall_cefr_estimate": "A1" | "A2" | "B1" | "B2" | "C1" | "C2" (estimate the CEFR level demonstrated by this writing),
  "grammatical_accuracy_score": number (1-10),
  "vocabulary_score": number (1-10),
  "coherence_score": number (1-10),
  "errors": [
    {
      "original": string (the erroneous text from the learner),
      "correction": string (the corrected version),
      "explanation": string (brief explanation of the error),
      "error_type": "grammar" | "vocabulary" | "spelling" | "word_order" | "case" | "conjugation"
    }
  ],
  "strengths": string[] (2-4 specific things the learner did well),
  "improvements": string[] (2-4 specific actionable suggestions),
  "model_answer": string (an improved version of the learner's text at their target level),
  "encouragement": string (motivating closing message)
}

${isBeginner ? `REMINDER: Maximum ${BEGINNER_MAX_ERRORS} items in the errors array for this ${level} learner.` : ''}

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
    const feedback: WritingFeedback = JSON.parse(jsonStr);

    // Validate required fields
    if (
      !VALID_LEVELS.includes(feedback.overall_cefr_estimate) ||
      typeof feedback.grammatical_accuracy_score !== 'number' ||
      typeof feedback.vocabulary_score !== 'number' ||
      typeof feedback.coherence_score !== 'number' ||
      !Array.isArray(feedback.errors) ||
      !Array.isArray(feedback.strengths) ||
      !Array.isArray(feedback.improvements) ||
      typeof feedback.model_answer !== 'string' ||
      typeof feedback.encouragement !== 'string'
    ) {
      throw new Error('Invalid response structure from AI');
    }

    // Clamp scores to 1-10
    feedback.grammatical_accuracy_score = Math.max(1, Math.min(10, Math.round(feedback.grammatical_accuracy_score)));
    feedback.vocabulary_score = Math.max(1, Math.min(10, Math.round(feedback.vocabulary_score)));
    feedback.coherence_score = Math.max(1, Math.min(10, Math.round(feedback.coherence_score)));

    // Enforce error limit for beginners
    if (isBeginner && feedback.errors.length > BEGINNER_MAX_ERRORS) {
      feedback.errors = feedback.errors.slice(0, BEGINNER_MAX_ERRORS);
    }

    return NextResponse.json(
      { success: true, data: feedback },
      { status: 200, headers: rlHeaders }
    );
  } catch (error) {
    console.error('Writing assessment error:', error);
    const isConfig = error instanceof Error && error.message.includes('not configured');

    return NextResponse.json(
      { error: isConfig ? 'Service temporarily unavailable' : 'An error occurred processing your request' },
      { status: isConfig ? 503 : 500, headers: rlHeaders }
    );
  }
}
