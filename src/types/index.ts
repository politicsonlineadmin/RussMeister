// ─── CEFR Levels ───────────────────────────────────────────────
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export type SkillType = 'speaking' | 'listening' | 'reading' | 'writing' | 'grammar' | 'vocabulary';

// ─── Learner Profile ───────────────────────────────────────────
export interface SkillBreakdown {
  speaking: CEFRLevel;
  listening: CEFRLevel;
  reading: CEFRLevel;
  writing: CEFRLevel;
  grammar: CEFRLevel;
  vocabulary: CEFRLevel;
}

export interface LearnerProfile {
  learner_id: string;
  name: string;
  assessed_level: CEFRLevel;
  skill_breakdown: SkillBreakdown;
  interest_domain: string;
  interest_subdomains: string[];
  native_language: string;
  session_count: number;
  vocabulary_learned: string[];
  grammar_points_covered: string[];
  weak_areas: SkillType[];
  strong_areas: SkillType[];
  created_at: string;
  alphabet_mastered: boolean;
  updated_at: string;
}

// ─── Vocabulary ────────────────────────────────────────────────
export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'article' | 'interjection';
export type Gender = 'masculine' | 'feminine' | 'neuter' | 'none';

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  domain: string;
  part_of_speech: PartOfSpeech;
  gender: Gender;
  plural: string;
  example_sentence: string;
  example_translation: string;
  ipa: string;
  image?: string;
  level: CEFRLevel;
  times_seen: number;
  times_correct: number;
  last_seen: string | null;
  next_review: string | null;
  difficulty_rating: number; // 1-5
  leitner_box: number; // 0-4 for SRS
}

// ─── Grammar ───────────────────────────────────────────────────
export interface GrammarPoint {
  id: string;
  topic: string;
  level: CEFRLevel;
  description: string;
  explanation: string;
  domain_examples: GrammarExample[];
  mastered: boolean;
  accuracy: number; // 0-100
  times_practiced: number;
}

export interface GrammarExample {
  russian: string;
  english: string;
  highlight: string; // the grammar element to highlight
}

// ─── Session ───────────────────────────────────────────────────
export type SessionPhase = 'warmup' | 'input' | 'practice' | 'production' | 'close';
export type ExerciseType = 'vocabulary_quiz' | 'fill_blank' | 'sentence_build' | 'reading_comprehension' | 'listening_comprehension' | 'speaking_task' | 'writing_task' | 'conjugation' | 'translation';

export interface SessionRecord {
  id: string;
  learner_id: string;
  date: string;
  duration_minutes: number;
  level: CEFRLevel;
  domain: string;
  phase_completed: SessionPhase[];
  vocabulary_introduced: string[];
  vocabulary_reviewed: string[];
  grammar_topic: string | null;
  exercises_completed: number;
  exercises_correct: number;
  accuracy: number;
  skill_focus: SkillType[];
  notes: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  level: CEFRLevel;
  instruction: string;
  instruction_ru?: string; // Russian instruction for B2+
  content: ExerciseContent;
  correct_answer?: string;
  hints?: string[];
}

export type ExerciseContent =
  | VocabQuizContent
  | FillBlankContent
  | SentenceBuildContent
  | ReadingContent
  | ListeningContent
  | SpeakingContent
  | WritingContent
  | TranslationContent;

export interface VocabQuizContent {
  word: string;
  image?: string;
  options: string[];
  correct_index: number;
}

export interface FillBlankContent {
  sentence: string; // Use ___ for blank
  options: string[];
  correct_answer: string;
}

export interface SentenceBuildContent {
  words: string[];
  correct_order: string;
}

export interface ReadingContent {
  passage: string;
  image?: string;
  questions: { question: string; options: string[]; correct_index: number }[];
}

export interface ListeningContent {
  text_to_speak: string;
  questions: { question: string; options: string[]; correct_index: number }[];
}

export interface SpeakingContent {
  target_phrase: string;
  context: string;
}

export interface WritingContent {
  prompt: string;
  min_sentences: number;
  vocabulary_to_use?: string[];
  grammar_focus?: string;
}

export interface TranslationContent {
  source: string;
  source_language: 'en' | 'ru';
  correct_translation: string;
}

// ─── Claude API Response Types ─────────────────────────────────
export interface SpeakingFeedback {
  overall_score: number;
  pronunciation_feedback: string;
  grammar_feedback: string;
  vocabulary_feedback: string;
  what_they_did_well: string;
  what_to_improve: string;
  corrected_version: string;
  encouragement: string;
}

export interface WritingFeedback {
  overall_cefr_estimate: CEFRLevel;
  grammatical_accuracy_score: number;
  vocabulary_score: number;
  coherence_score: number;
  errors: WritingError[];
  strengths: string[];
  improvements: string[];
  model_answer: string;
  encouragement: string;
}

export interface WritingError {
  original: string;
  correction: string;
  explanation: string;
  error_type: 'grammar' | 'vocabulary' | 'spelling' | 'word_order' | 'case' | 'conjugation';
}

export interface LevelAssessment {
  assessed_level: CEFRLevel;
  skill_breakdown: SkillBreakdown;
  confidence: number;
  reasoning: string;
  recommendations: string[];
}

// ─── App State ─────────────────────────────────────────────────
export type AppScreen = 'onboarding' | 'assessment' | 'alphabet' | 'dashboard' | 'session' | 'vocabulary' | 'grammar' | 'progress';

export interface AppState {
  currentScreen: AppScreen;
  profile: LearnerProfile | null;
  isLoading: boolean;
  error: string | null;
}

// ─── Speech API Types ──────────────────────────────────────────
export interface SpeechResult {
  transcript: string;
  confidence: number;
  error?: string;
}

export interface TTSConfig {
  rate: number;
  pitch: number;
  lang: string;
}

export const SPEECH_RATES: Record<CEFRLevel, number> = {
  A1: 0.75,
  A2: 0.85,
  B1: 0.85,
  B2: 0.95,
  C1: 1.0,
  C2: 1.0,
};
