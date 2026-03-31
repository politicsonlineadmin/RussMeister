import { NextRequest, NextResponse } from 'next/server';
import type {
  CEFRLevel,
  ExerciseType,
  Exercise,
  LevelAssessment,
  SkillType,
} from '@/types';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { cefrToNumber } from '@/lib/utils';
import { getRequiredEnv } from '@/lib/env';

// ─── Constants ────────────────────────────────────────────────
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

const VALID_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_EXERCISE_TYPES: ExerciseType[] = [
  'vocabulary_quiz', 'fill_blank', 'sentence_build', 'reading_comprehension',
  'listening_comprehension', 'speaking_task', 'writing_task', 'conjugation', 'translation',
];
const VALID_CONTENT_TYPES = ['reading_passage', 'vocabulary_set', 'cultural_note'] as const;
const VALID_SKILLS: SkillType[] = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary'];

const SYSTEM_PROMPT = `You are RussMeister, an expert Russian language tutor powered by AI. You specialize in teaching Russian from beginner (A1) to advanced (C2) levels following the CEFR framework.

Core principles:
- Always adapt your language complexity to the learner's current level
- For A1/A2: Use simple English explanations with Russian examples
- For B1/B2: Mix Russian and English, gradually increasing Russian usage
- For C1/C2: Primarily use Russian with nuanced explanations
- Provide culturally authentic examples drawn from the learner's interest domain
- Be encouraging but honest about errors
- Follow the natural language acquisition order: comprehension before production
- Always respond with valid JSON matching the requested schema exactly`;

// ─── Helpers ──────────────────────────────────────────────────
function sanitizeString(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim().slice(0, 5000);
}

function isValidLevel(level: unknown): level is CEFRLevel {
  return typeof level === 'string' && VALID_LEVELS.includes(level as CEFRLevel);
}

// Rate limiting is handled via checkRateLimit from '@/lib/rate-limit'

async function callClaude(userPrompt: string): Promise<string> {
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
      messages: [{ role: 'user', content: userPrompt }],
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
  return textBlock.text;
}

function parseJsonResponse<T>(raw: string): T {
  // Extract JSON from potential markdown code fences
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
  return JSON.parse(jsonStr) as T;
}

// ─── Action Handlers ──────────────────────────────────────────
async function handleGenerateExercise(payload: {
  level: CEFRLevel;
  domain: string;
  exercise_type: ExerciseType;
  grammar_topic?: string;
}): Promise<Exercise> {
  const { level, domain, exercise_type, grammar_topic } = payload;

  if (!isValidLevel(level)) {
    throw new Error(`Invalid CEFR level: ${level}`);
  }
  if (!VALID_EXERCISE_TYPES.includes(exercise_type)) {
    throw new Error(`Invalid exercise type: ${exercise_type}`);
  }
  if (!domain || typeof domain !== 'string') {
    throw new Error('Domain is required');
  }

  const grammarClause = grammar_topic
    ? `\nThe exercise should focus on this grammar topic: "${sanitizeString(grammar_topic)}".`
    : '';

  const prompt = `Generate a single Russian language exercise with these parameters:
- CEFR Level: ${level}
- Interest Domain: ${sanitizeString(domain)}
- Exercise Type: ${exercise_type}${grammarClause}

${cefrToNumber(level) >= cefrToNumber('B2') ? 'Include a Russian-language instruction (instruction_ru) since the learner is at B2+.' : ''}

Respond with ONLY a JSON object matching this TypeScript interface:
{
  "id": string (a UUID),
  "type": "${exercise_type}",
  "level": "${level}",
  "instruction": string (clear instruction in English),
  "instruction_ru": string | undefined (Russian instruction for B2+),
  "content": object (matching the content type for ${exercise_type}),
  "correct_answer": string | undefined,
  "hints": string[] | undefined (1-3 helpful hints)
}

For exercise type "${exercise_type}", the content object must match the appropriate schema:
- vocabulary_quiz: { word: string, options: string[], correct_index: number }
- fill_blank: { sentence: string (use ___ for blank), options: string[], correct_answer: string }
- sentence_build: { words: string[], correct_order: string }
- reading_comprehension: { passage: string, questions: [{ question: string, options: string[], correct_index: number }] }
- listening_comprehension: { text_to_speak: string, questions: [{ question: string, options: string[], correct_index: number }] }
- speaking_task: { target_phrase: string, context: string }
- writing_task: { prompt: string, min_sentences: number, vocabulary_to_use?: string[], grammar_focus?: string }
- translation: { source: string, source_language: "en" | "ru", correct_translation: string }
- conjugation: { sentence: string (use ___ for blank), options: string[], correct_answer: string }

Return ONLY valid JSON, no additional text.`;

  const raw = await callClaude(prompt);
  return parseJsonResponse<Exercise>(raw);
}

async function handleAssessLevel(payload: {
  responses: { skill: SkillType; question: string; answer: string; correct: boolean }[];
}): Promise<LevelAssessment> {
  const { responses } = payload;

  if (!Array.isArray(responses) || responses.length === 0) {
    throw new Error('Responses array is required and must not be empty');
  }

  for (const r of responses) {
    if (!VALID_SKILLS.includes(r.skill)) {
      throw new Error(`Invalid skill type: ${r.skill}`);
    }
    if (typeof r.question !== 'string' || typeof r.answer !== 'string' || typeof r.correct !== 'boolean') {
      throw new Error('Each response must have question (string), answer (string), and correct (boolean)');
    }
  }

  const sanitizedResponses = responses.map((r) => ({
    skill: r.skill,
    question: sanitizeString(r.question),
    answer: sanitizeString(r.answer),
    correct: r.correct,
  }));

  const prompt = `Based on the following assessment responses from a Russian language learner, determine their CEFR level and provide a skill breakdown.

Assessment responses:
${JSON.stringify(sanitizedResponses, null, 2)}

Analyze the learner's performance across all skill areas and respond with ONLY a JSON object matching this schema:
{
  "assessed_level": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "skill_breakdown": {
    "speaking": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    "listening": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    "reading": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    "writing": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    "grammar": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    "vocabulary": "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  },
  "confidence": number (0-1, how confident you are in this assessment),
  "reasoning": string (explanation of your assessment),
  "recommendations": string[] (2-5 specific recommendations for improvement)
}

Return ONLY valid JSON, no additional text.`;

  const raw = await callClaude(prompt);
  return parseJsonResponse<LevelAssessment>(raw);
}

async function handleGenerateContent(payload: {
  level: CEFRLevel;
  domain: string;
  content_type: (typeof VALID_CONTENT_TYPES)[number];
}): Promise<unknown> {
  const { level, domain, content_type } = payload;

  if (!isValidLevel(level)) {
    throw new Error(`Invalid CEFR level: ${level}`);
  }
  if (!domain || typeof domain !== 'string') {
    throw new Error('Domain is required');
  }
  if (!VALID_CONTENT_TYPES.includes(content_type)) {
    throw new Error(`Invalid content type: ${content_type}`);
  }

  const schemaByType: Record<string, string> = {
    reading_passage: `{
  "title": string,
  "title_en": string,
  "passage": string (in Russian, appropriate for ${level}),
  "translation": string (English translation),
  "vocabulary_highlights": [{ "word": string, "translation": string, "part_of_speech": string }],
  "comprehension_questions": [{ "question": string, "answer": string }]
}`,
    vocabulary_set: `{
  "theme": string,
  "items": [{
    "word": string,
    "translation": string,
    "gender": "masculine" | "feminine" | "neuter" | "none",
    "plural": string,
    "example_sentence": string,
    "example_translation": string,
    "part_of_speech": string,
    "ipa": string
  }]
}`,
    cultural_note: `{
  "title": string,
  "content": string (in English with key Russian terms),
  "key_phrases": [{ "russian": string, "english": string }],
  "did_you_know": string,
  "practical_tip": string
}`,
  };

  const prompt = `Generate ${content_type.replace(/_/g, ' ')} content for a Russian language learner:
- CEFR Level: ${level}
- Interest Domain: ${sanitizeString(domain)}

The content should be culturally authentic and appropriate for the learner's level.
For ${level} learners, ${
    cefrToNumber(level) <= cefrToNumber('A2')
      ? 'use simple vocabulary and short sentences'
      : cefrToNumber(level) <= cefrToNumber('B2')
        ? 'use intermediate vocabulary with some complex structures'
        : 'use advanced vocabulary and sophisticated structures'
  }.

${content_type === 'vocabulary_set' ? 'Generate 8-12 vocabulary items.' : ''}

Respond with ONLY a JSON object matching this schema:
${schemaByType[content_type]}

Return ONLY valid JSON, no additional text.`;

  const raw = await callClaude(prompt);
  return parseJsonResponse<unknown>(raw);
}

// ─── Error Sanitization ──────────────────────────────────────
function sanitizeErrorMessage(error: unknown): { message: string; status: number } {
  if (!(error instanceof Error)) {
    return { message: 'An unexpected error occurred', status: 500 };
  }
  const msg = error.message;
  if (msg.includes('not configured')) {
    return { message: 'Service temporarily unavailable', status: 503 };
  }
  if (msg.includes('Invalid')) {
    return { message: msg, status: 400 };
  }
  // Don't leak Anthropic API details to the client
  return { message: 'An error occurred processing your request', status: 500 };
}

// ─── Route Handler ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Real rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  const rl = checkRateLimit(ip, 30);
  const rlHeaders = rateLimitHeaders(rl);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    const body = await request.json();
    const { action, payload } = body;

    // Validate action and payload types
    if (typeof action !== 'string' || !action) {
      return NextResponse.json(
        { error: 'Missing or invalid field: action must be a string' },
        { status: 400, headers: rlHeaders }
      );
    }
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return NextResponse.json(
        { error: 'Missing or invalid field: payload must be an object' },
        { status: 400, headers: rlHeaders }
      );
    }

    let result: unknown;

    switch (action) {
      case 'generate_exercise':
        result = await handleGenerateExercise(payload);
        break;
      case 'assess_level':
        result = await handleAssessLevel(payload);
        break;
      case 'generate_content':
        result = await handleGenerateContent(payload);
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400, headers: rlHeaders }
        );
    }

    return NextResponse.json(
      { success: true, data: result },
      { status: 200, headers: rlHeaders }
    );
  } catch (error) {
    console.error('Claude API route error:', error);
    const { message, status } = sanitizeErrorMessage(error);

    return NextResponse.json(
      { error: message },
      { status, headers: rlHeaders }
    );
  }
}
