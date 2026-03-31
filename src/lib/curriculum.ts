import type {
  CEFRLevel,
  LearnerProfile,
  VocabularyItem,
  GrammarPoint,
  SessionRecord,
  SkillType,
} from '@/types';
import { CEFR_ORDER } from '@/types';
import { cefrToNumber } from '@/lib/utils';

/**
 * Grammar topics organized by CEFR level.
 */
const GRAMMAR_TOPICS: Record<CEFRLevel, string[]> = {
  A1: [
    'Present tense (настоящее время) of regular verbs',
    'Быть and иметь (to be and to have)',
    'Nominative case (именительный падеж)',
    'Accusative case (винительный падеж)',
    'Gender: masculine, feminine, neuter (мужской, женский, средний род)',
    'Plural forms of nouns',
    'Basic word order (SVO)',
    'Yes/no questions and question words',
    'Negation with не and нет',
    'Personal pronouns (nominative)',
    'Possessive pronouns (мой, твой, etc.)',
    'Demonstrative pronouns (этот, тот)',
    'Basic conjunctions (и, а, но)',
    'Introduction to verb conjugation groups (1st and 2nd)',
    'Cardinal and ordinal numbers',
  ],
  A2: [
    'Past tense (прошедшее время)',
    'Future tense (simple and compound)',
    'Modal verbs: мочь, должен, хотеть',
    'Dative case (дательный падеж)',
    'Prepositional case (предложный падеж)',
    'Common prepositions (в, на, с, к, у, из, о)',
    'Reflexive verbs (-ся/-сь)',
    'Comparative and superlative adjectives',
    'Short-form adjectives',
    'Verbs of motion (идти/ходить, ехать/ездить)',
    'Aspect introduction: perfective vs. imperfective (basic)',
    'Subordinating conjunctions (что, когда, где)',
    'Time expressions and temporal constructions',
    'Imperative mood (commands)',
    'Ordinal numbers and dates',
  ],
  B1: [
    'Perfective and imperfective aspect (совершенный/несовершенный вид)',
    'Genitive case (родительный падеж)',
    'Relative clauses with который',
    'Subordinating conjunctions (потому что, если, хотя, чтобы)',
    'Reflexive verbs (advanced usage)',
    'Conditional mood with бы',
    'Verbs of motion with prefixes (выходить, приходить, уходить)',
    'Numerals with cases (genitive after numbers)',
    'Indirect speech',
    'Short-form and long-form adjective usage',
    'Adverbial participles (деепричастия, basic)',
    'Impersonal constructions (можно, нужно, нельзя)',
    'Expressing obligation and necessity',
    'Complex time expressions',
    'Adverbial connectors (поэтому, однако, кроме того)',
  ],
  B2: [
    'Passive voice (страдательный залог)',
    'Instrumental case (творительный падеж)',
    'Complex sentence structures',
    'Verbal adjectives / participles (причастия)',
    'Verbal adverbs / adverbial participles (деепричастия)',
    'All six cases in complex usage',
    'Subjunctive and conditional constructions (advanced бы)',
    'Reported speech and sequence of tenses',
    'Prefixed verbs of motion (advanced)',
    'Word formation: prefixes, suffixes, and roots',
    'Correlative conjunctions (как...так и, не только...но и)',
    'Advanced preposition usage with case governance',
    'Text connectors and discourse markers',
    'Nominalization patterns',
    'Expressing concession (несмотря на то что, хотя)',
  ],
  C1: [
    'Advanced aspect usage and aspectual pairs',
    'Participle phrases (причастные обороты)',
    'Adverbial participle phrases (деепричастные обороты)',
    'Stylistic variation and register switching',
    'Formal, academic, and colloquial registers',
    'Advanced discourse markers and cohesion devices',
    'Complex nominalization and verbal noun constructions',
    'Idiomatic expressions and phraseological units',
    'Advanced word order for emphasis and style',
    'Ellipsis and substitution in Russian',
    'Modal particles and pragmatic markers',
    'Scientific and academic writing conventions',
  ],
  C2: [
    'Literary styles and rhetorical devices',
    'Archaic and literary grammatical forms',
    'Regional variation in Russian',
    'Full mastery of all 6 cases in all contexts',
    'Nuanced aspect and tense usage in literary texts',
    'Advanced stylistic devices and rhetoric',
    'Pragmatic functions of grammatical structures',
    'Subtle distinctions between near-synonymous constructions',
    'Advanced punctuation and orthographic conventions',
    'Metalinguistic awareness and grammar terminology',
  ],
};

/**
 * Target vocabulary counts by CEFR level (cumulative).
 */
const VOCABULARY_TARGETS: Record<CEFRLevel, number> = {
  A1: 500,
  A2: 1000,
  B1: 2000,
  B2: 4000,
  C1: 8000,
  C2: 16000,
};

/**
 * Get the grammar topics that should be covered at a given CEFR level.
 */
export function getGrammarTopicsForLevel(level: CEFRLevel): string[] {
  return GRAMMAR_TOPICS[level];
}

/**
 * Get the target vocabulary count for a CEFR level.
 */
export function getVocabularyTargetForLevel(level: CEFRLevel): number {
  return VOCABULARY_TARGETS[level];
}

/**
 * Calculate overall progress (0-100) toward the current CEFR level.
 * Weighted: 50% vocabulary progress, 50% grammar mastery.
 */
export function getLevelProgress(
  profile: LearnerProfile,
  vocabulary: VocabularyItem[],
  grammar: GrammarPoint[]
): number {
  const level = profile.assessed_level;
  const targetVocab = VOCABULARY_TARGETS[level];

  // Count vocabulary items at or below current level that have been reviewed
  const learnedVocab = vocabulary.filter(
    (v) => cefrToNumber(v.level) <= cefrToNumber(level) && v.times_seen > 0
  ).length;
  const vocabProgress = Math.min(100, (learnedVocab / targetVocab) * 100);

  // Count mastered grammar points at or below current level
  const levelGrammar = grammar.filter(
    (g) => cefrToNumber(g.level) <= cefrToNumber(level)
  );
  const totalGrammarTopics = CEFR_ORDER
    .filter((l) => cefrToNumber(l) <= cefrToNumber(level))
    .reduce((sum, l) => sum + GRAMMAR_TOPICS[l].length, 0);

  const masteredGrammar = levelGrammar.filter((g) => g.mastered).length;
  const grammarProgress =
    totalGrammarTopics > 0
      ? Math.min(100, (masteredGrammar / totalGrammarTopics) * 100)
      : 0;

  // Weighted average: 50% vocab, 50% grammar
  const progress = vocabProgress * 0.5 + grammarProgress * 0.5;
  return Math.round(Math.min(100, Math.max(0, progress)));
}

/**
 * Determine if a learner should level up based on recent session performance.
 * Requires accuracy > 85% over the last 3 sessions.
 */
export function shouldLevelUp(
  profile: LearnerProfile,
  recentSessions: SessionRecord[]
): boolean {
  // Cannot level up beyond C2
  if (profile.assessed_level === 'C2') return false;

  // Need at least 3 sessions to evaluate
  const lastThree = recentSessions
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (lastThree.length < 3) return false;

  const averageAccuracy =
    lastThree.reduce((sum, s) => sum + s.accuracy, 0) / lastThree.length;

  return averageAccuracy > 85;
}

/**
 * Identify the learner's weakest skill based on their skill breakdown.
 * Returns the skill with the lowest CEFR level.
 */
export function getWeakestSkill(profile: LearnerProfile): SkillType {
  const breakdown = profile.skill_breakdown;
  const skills: SkillType[] = [
    'speaking',
    'listening',
    'reading',
    'writing',
    'grammar',
    'vocabulary',
  ];

  let weakest: SkillType = skills[0];
  let lowestLevel = cefrToNumber(breakdown[weakest]);

  for (const skill of skills) {
    const level = cefrToNumber(breakdown[skill]);
    if (level < lowestLevel) {
      lowestLevel = level;
      weakest = skill;
    }
  }

  return weakest;
}
