import type {
  CEFRLevel,
  ExerciseType,
  Exercise,
  SpeakingFeedback,
  WritingFeedback,
  LevelAssessment,
  SkillType,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface GenerateExerciseParams {
  level: CEFRLevel;
  domain: string;
  exercise_type: ExerciseType;
  grammar_topic?: string;
}

interface AssessSpeakingParams {
  target_phrase: string;
  transcript: string;
  confidence: number;
  level: CEFRLevel;
  domain: string;
}

interface AssessWritingParams {
  task_description: string;
  learner_text: string;
  level: CEFRLevel;
  domain: string;
}

interface AssessLevelParams {
  responses: {
    skill: SkillType;
    question: string;
    answer: string;
    correct: boolean;
  }[];
}

interface GenerateContentParams {
  level: CEFRLevel;
  domain: string;
  content_type: 'reading_passage' | 'vocabulary_set' | 'cultural_note';
}

// ─── Error Class ──────────────────────────────────────────────
export class ApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ─── Internal Fetch Wrapper ───────────────────────────────────
async function apiRequest<T>(url: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    throw new ApiError(
      'Network error: unable to reach the server. Please check your connection.',
      0
    );
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Use default error message
    }
    throw new ApiError(errorMessage, response.status);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success || !result.data) {
    throw new ApiError(result.error || 'Unexpected response format', 500);
  }

  return result.data;
}

// ─── Public API Functions ─────────────────────────────────────

/**
 * Generate a Russian language exercise via Claude.
 */
export async function generateExercise(
  params: GenerateExerciseParams
): Promise<Exercise> {
  return apiRequest<Exercise>('/api/claude', {
    action: 'generate_exercise',
    payload: params,
  });
}

/**
 * Assess a speaking attempt by comparing the transcript to the target phrase.
 */
export async function assessSpeaking(
  params: AssessSpeakingParams
): Promise<SpeakingFeedback> {
  return apiRequest<SpeakingFeedback>('/api/assess/speaking', params);
}

/**
 * Assess a writing submission for grammar, vocabulary, and coherence.
 */
export async function assessWriting(
  params: AssessWritingParams
): Promise<WritingFeedback> {
  return apiRequest<WritingFeedback>('/api/assess/writing', params);
}

/**
 * Assess the learner's overall CEFR level based on assessment responses.
 */
export async function assessLevel(
  params: AssessLevelParams
): Promise<LevelAssessment> {
  return apiRequest<LevelAssessment>('/api/claude', {
    action: 'assess_level',
    payload: params,
  });
}

/**
 * Generate learning content (reading passages, vocabulary sets, cultural notes).
 */
export async function generateContent(
  params: GenerateContentParams
): Promise<unknown> {
  return apiRequest<unknown>('/api/claude', {
    action: 'generate_content',
    payload: params,
  });
}
