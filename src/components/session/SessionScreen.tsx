'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  LearnerProfile,
  AppScreen,
  SessionPhase,
  Exercise,
  VocabQuizContent,
  FillBlankContent,
  SentenceBuildContent,
  TranslationContent,
  WritingContent,
  SpeakingContent,
  SessionRecord,
  VocabularyItem,
} from '@/types';
import Button from '@/components/ui/Button';
import AudioButton from '@/components/ui/AudioButton';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import ExerciseCard from '@/components/session/ExerciseCard';
import { loadVocabulary, saveVocabulary, loadSessionHistory, saveSessionHistory } from '@/lib/storage';
import { getDueItems, calculateNextReview } from '@/lib/srs';
import { generateId } from '@/lib/utils';
import { useTTS } from '@/hooks/useSpeech';
import { useSTT } from '@/hooks/useSpeech';

// ─── Phase config ────────────────────────────────────────────

const PHASES: SessionPhase[] = ['warmup', 'input', 'practice', 'production', 'close'];

const PHASE_LABELS: Record<SessionPhase, string> = {
  warmup: 'Warm-up',
  input: 'New Input',
  practice: 'Practice',
  production: 'Production',
  close: 'Summary',
};

const PHASE_ICONS: Record<SessionPhase, string> = {
  warmup: 'M13 10V3L4 14h7v7l9-11h-7z', // lightning bolt
  input: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', // book
  practice: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // smiley practice
  production: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', // pen
  close: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // check circle
};

// ─── Sample Exercises ────────────────────────────────────────

function getWarmupExercises(dueItems: VocabularyItem[]): Exercise[] {
  return dueItems.slice(0, 8).map((item, idx) => {
    const distractors = getDistractors(item.translation, item.domain);
    const options = shuffleWithCorrect(distractors, item.translation);
    const correctIndex = options.indexOf(item.translation);

    return {
      id: `warmup-${idx}`,
      type: 'vocabulary_quiz' as const,
      level: item.level,
      instruction: 'What does this word mean?',
      content: {
        word: item.word,
        options,
        correct_index: correctIndex,
      } as VocabQuizContent,
    };
  });
}

function getDistractors(correct: string, domain: string): string[] {
  const footballPool = [
    'the goal', 'the ball', 'the player', 'the team', 'the coach', 'the field',
    'the match', 'the referee', 'the stadium', 'the fan', 'the kick',
    'to score', 'to play', 'to win', 'to lose', 'to pass', 'to shoot',
    'half-time', 'corner kick', 'penalty', 'offside',
  ];
  const generalPool = [
    'the house', 'the dog', 'the cat', 'the water', 'the book', 'the child',
    'the woman', 'the man', 'good', 'big', 'small', 'to eat', 'to drink',
    'to sleep', 'to go', 'to come', 'hello', 'goodbye', 'please', 'thank you',
    'the school', 'the car', 'the tree', 'the day', 'the night',
  ];
  const pool = domain.toLowerCase().includes('football') ? footballPool : generalPool;
  const filtered = pool.filter((w) => w !== correct);
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function shuffleWithCorrect(distractors: string[], correct: string): string[] {
  const arr = [...distractors, correct];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Football domain A1 exercises
const FOOTBALL_A1_PRACTICE: Exercise[] = [
  {
    id: 'fb-fill-1',
    type: 'fill_blank',
    level: 'A1',
    instruction: 'Fill in the blank with the correct word.',
    content: {
      sentence: '\u041C\u044F\u0447 ___ \u043A\u0440\u0443\u0433\u043B\u044B\u0439.',
      options: ['\u2014', '\u0435\u0441\u0442\u044C', '\u0431\u044B\u043B', '\u0431\u0443\u0434\u0435\u0442'],
      correct_answer: '\u2014',
    } as FillBlankContent,
  },
  {
    id: 'fb-build-1',
    type: 'sentence_build',
    level: 'A1',
    instruction: 'Put the words in the correct order to make a sentence.',
    content: {
      words: ['\u0438\u0433\u0440\u0430\u0435\u0442', '\u041E\u043D', '\u0432', '\u0444\u0443\u0442\u0431\u043E\u043B'],
      correct_order: '\u041E\u043D \u0438\u0433\u0440\u0430\u0435\u0442 \u0432 \u0444\u0443\u0442\u0431\u043E\u043B',
    } as SentenceBuildContent,
  },
  {
    id: 'fb-trans-1',
    type: 'translation',
    level: 'A1',
    instruction: 'Translate this sentence into Russian.',
    content: {
      source: 'The team plays well.',
      source_language: 'en',
      correct_translation: '\u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u0438\u0433\u0440\u0430\u0435\u0442 \u0445\u043E\u0440\u043E\u0448\u043E',
    } as TranslationContent,
  },
  {
    id: 'fb-fill-2',
    type: 'fill_blank',
    level: 'A1',
    instruction: 'Choose the correct verb form.',
    content: {
      sentence: '\u0418\u0433\u0440\u043E\u043A\u0438 ___ \u043F\u043E \u043F\u043E\u043B\u044E.',
      options: ['\u0431\u0435\u0433\u0430\u044E\u0442', '\u0431\u0435\u0433\u0430\u0435\u0442', '\u0431\u0435\u0433\u0430\u0435\u0448\u044C', '\u0431\u0435\u0433\u0430\u044E'],
      correct_answer: '\u0431\u0435\u0433\u0430\u044E\u0442',
    } as FillBlankContent,
  },
  {
    id: 'fb-trans-2',
    type: 'translation',
    level: 'A1',
    instruction: 'Translate into English.',
    content: {
      source: '\u0412\u0440\u0430\u0442\u0430\u0440\u044C \u043B\u043E\u0432\u0438\u0442 \u043C\u044F\u0447.',
      source_language: 'ru',
      correct_translation: 'The goalkeeper catches the ball',
    } as TranslationContent,
  },
];

// General domain A1 exercises
const GENERAL_A1_PRACTICE: Exercise[] = [
  {
    id: 'gen-fill-1',
    type: 'fill_blank',
    level: 'A1',
    instruction: 'Fill in the blank with the correct word.',
    content: {
      sentence: '\u0416\u0435\u043D\u0449\u0438\u043D\u0430 ___ \u043A\u043E\u0444\u0435.',
      options: ['\u043F\u044C\u0451\u0442', '\u043F\u044C\u044E', '\u043F\u044C\u0451\u0448\u044C', '\u043F\u044C\u044E\u0442'],
      correct_answer: '\u043F\u044C\u0451\u0442',
    } as FillBlankContent,
  },
  {
    id: 'gen-build-1',
    type: 'sentence_build',
    level: 'A1',
    instruction: 'Put the words in the correct order.',
    content: {
      words: ['\u0437\u043E\u0432\u0443\u0442', '\u041A\u0430\u043A', '\u0442\u0435\u0431\u044F'],
      correct_order: '\u041A\u0430\u043A \u0442\u0435\u0431\u044F \u0437\u043E\u0432\u0443\u0442',
    } as SentenceBuildContent,
  },
  {
    id: 'gen-trans-1',
    type: 'translation',
    level: 'A1',
    instruction: 'Translate this sentence into Russian.',
    content: {
      source: 'I am learning Russian.',
      source_language: 'en',
      correct_translation: '\u042F \u0443\u0447\u0443 \u0440\u0443\u0441\u0441\u043A\u0438\u0439 \u044F\u0437\u044B\u043A',
    } as TranslationContent,
  },
  {
    id: 'gen-fill-2',
    type: 'fill_blank',
    level: 'A1',
    instruction: 'Choose the correct pronoun.',
    content: {
      sentence: '___ \u0436\u0438\u0432\u0451\u043C \u0432 \u0420\u043E\u0441\u0441\u0438\u0438.',
      options: ['\u042F', '\u0422\u044B', '\u041E\u043D', '\u041C\u044B'],
      correct_answer: '\u041C\u044B',
    } as FillBlankContent,
  },
  {
    id: 'gen-build-2',
    type: 'sentence_build',
    level: 'A1',
    instruction: 'Build the sentence.',
    content: {
      words: ['\u0445\u043E\u0440\u043E\u0448\u0430\u044F', '\u042D\u0442\u043E', '\u043A\u043D\u0438\u0433\u0430'],
      correct_order: '\u042D\u0442\u043E \u0445\u043E\u0440\u043E\u0448\u0430\u044F \u043A\u043D\u0438\u0433\u0430',
    } as SentenceBuildContent,
  },
];

// Input phase content
const INPUT_CONTENT: Record<string, { title: string; explanation: string; examples: { russian: string; english: string }[] }> = {
  football: {
    title: 'Noun Gender and Basic Cases',
    explanation:
      'In Russian, every noun has a grammatical gender: masculine, feminine, or neuter. Football vocabulary: \u043C\u044F\u0447 (the ball, masc.), \u043A\u043E\u043C\u0430\u043D\u0434\u0430 (the team, fem.), \u043F\u043E\u043B\u0435 (the field, neut.), \u0438\u0433\u0440\u043E\u043A (the player, masc.), \u0432\u043E\u0440\u043E\u0442\u0430 (the goal, pl.).',
    examples: [
      { russian: '\u041C\u044F\u0447 \u043A\u0440\u0443\u0433\u043B\u044B\u0439.', english: 'The ball is round.' },
      { russian: '\u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u0438\u0433\u0440\u0430\u0435\u0442 \u0445\u043E\u0440\u043E\u0448\u043E.', english: 'The team plays well.' },
      { russian: '\u041F\u043E\u043B\u0435 \u0431\u043E\u043B\u044C\u0448\u043E\u0435.', english: 'The field is big.' },
    ],
  },
  general: {
    title: 'Present Tense: Regular Verbs',
    explanation:
      'Russian verbs conjugate based on the subject. The two main conjugation groups use different endings. For example: \u0447\u0438\u0442\u0430\u0442\u044C (to read) \u2014 \u044F \u0447\u0438\u0442\u0430\u044E, \u0442\u044B \u0447\u0438\u0442\u0430\u0435\u0448\u044C, \u043E\u043D/\u043E\u043D\u0430 \u0447\u0438\u0442\u0430\u0435\u0442, \u043C\u044B \u0447\u0438\u0442\u0430\u0435\u043C, \u0432\u044B \u0447\u0438\u0442\u0430\u0435\u0442\u0435, \u043E\u043D\u0438 \u0447\u0438\u0442\u0430\u044E\u0442.',
    examples: [
      { russian: '\u042F \u0443\u0447\u0443 \u0440\u0443\u0441\u0441\u043A\u0438\u0439 \u044F\u0437\u044B\u043A.', english: 'I am learning Russian.' },
      { russian: '\u0422\u044B \u0438\u0433\u0440\u0430\u0435\u0448\u044C \u0445\u043E\u0440\u043E\u0448\u043E.', english: 'You play well.' },
      { russian: '\u041C\u044B \u0436\u0438\u0432\u0451\u043C \u0432 \u041C\u043E\u0441\u043A\u0432\u0435.', english: 'We live in Moscow.' },
    ],
  },
};

// Production prompts
const PRODUCTION_PROMPTS: Record<string, { writing: WritingContent; speaking: SpeakingContent }> = {
  football: {
    writing: {
      prompt: 'Write 2-3 sentences about your favorite football team in Russian.',
      min_sentences: 2,
      vocabulary_to_use: ['\u043A\u043E\u043C\u0430\u043D\u0434\u0430', '\u0438\u0433\u0440\u0430\u0442\u044C', '\u043C\u044F\u0447'],
      grammar_focus: 'Noun gender and verb conjugation',
    },
    speaking: {
      target_phrase: '\u041C\u043E\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u043E\u0447\u0435\u043D\u044C \u0445\u043E\u0440\u043E\u0448\u043E \u0438\u0433\u0440\u0430\u0435\u0442 \u0432 \u0444\u0443\u0442\u0431\u043E\u043B.',
      context: 'Tell someone about your favorite football team.',
    },
  },
  general: {
    writing: {
      prompt: 'Introduce yourself in Russian. Write 2-3 sentences using the present tense.',
      min_sentences: 2,
      vocabulary_to_use: ['\u0437\u043E\u0432\u0443\u0442', '\u0436\u0438\u0442\u044C', '\u0443\u0447\u0438\u0442\u044C'],
      grammar_focus: 'Present tense conjugation',
    },
    speaking: {
      target_phrase: '\u041C\u0435\u043D\u044F \u0437\u043E\u0432\u0443\u0442 ... \u0438 \u044F \u0443\u0447\u0443 \u0440\u0443\u0441\u0441\u043A\u0438\u0439 \u044F\u0437\u044B\u043A.',
      context: 'Introduce yourself to a new classmate.',
    },
  },
};

// ─── Phase Indicator ─────────────────────────────────────────

function PhaseIndicator({ currentPhase }: { currentPhase: SessionPhase }) {
  const currentIdx = PHASES.indexOf(currentPhase);

  return (
    <div className="flex items-center justify-center mb-10 px-2">
      {PHASES.map((phase, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={phase} className="flex items-center">
            {/* Circle + label column */}
            <div className="flex flex-col items-center relative">
              {/* Numbered circle */}
              <motion.div
                layout
                className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'w-9 h-9 bg-[#4CAF50] border-2 border-[#4CAF50]'
                    : isCurrent
                      ? 'w-10 h-10 bg-[#e58300] border-2 border-[#e58300]'
                      : 'w-9 h-9 bg-white border-2 border-gray-300'
                }`}
              >
                {isCompleted ? (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </motion.svg>
                ) : (
                  <span
                    className={`text-sm font-bold ${
                      isCurrent ? 'text-white' : 'text-[#3d6b6b]/50'
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}
              </motion.div>

              {/* Label */}
              <span
                className={`text-[11px] mt-2 font-medium whitespace-nowrap transition-colors duration-300 ${
                  isCurrent
                    ? 'text-[#e58300] font-bold'
                    : isCompleted
                      ? 'text-[#4CAF50]'
                      : 'text-[#3d6b6b]/50'
                }`}
              >
                {PHASE_LABELS[phase]}
              </span>
            </div>

            {/* Connecting line */}
            {idx < PHASES.length - 1 && (
              <div className="relative w-10 sm:w-14 h-[2px] mx-1 mb-5">
                <div className="absolute inset-0 bg-gray-200 rounded-full" />
                {isCompleted && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-[#4CAF50] rounded-full"
                  />
                )}
                {isCurrent && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '40%' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-[#e58300] rounded-full"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Exercise Counter ────────────────────────────────────────

function ExerciseCounter({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tabular-nums text-[#e58300]">
          {current}
        </span>
        <span className="text-[#3d6b6b]/70 text-sm">of</span>
        <span className="text-sm font-bold text-[#3d6b6b]/50 tabular-nums">{total}</span>
      </div>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#e58300]"
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────

interface SessionScreenProps {
  profile: LearnerProfile;
  onProfileUpdate: (p: LearnerProfile) => void;
  onNavigate: (screen: AppScreen) => void;
}

// ─── Main Component ──────────────────────────────────────────

export default function SessionScreen({
  profile,
  onProfileUpdate,
  onNavigate,
}: SessionScreenProps) {
  const { speak } = useTTS();
  const { startListening, stopListening, transcript, isListening, isSupported: sttSupported } = useSTT();

  // Session state
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>('warmup');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [sessionStartTime] = useState(() => Date.now());

  // Tracking
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [warmupResults, setWarmupResults] = useState<{ itemId: string; correct: boolean }[]>([]);
  const [wordsLearned, setWordsLearned] = useState<string[]>([]);
  const [phasesCompleted, setPhasesCompleted] = useState<SessionPhase[]>([]);

  // Production state
  const [writingInput, setWritingInput] = useState('');
  const [productionSubmitted, setProductionSubmitted] = useState(false);
  const [productionMode, setProductionMode] = useState<'writing' | 'speaking'>('writing');

  // Vocabulary & exercises
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [warmupExercises, setWarmupExercises] = useState<Exercise[]>([]);

  const domain = profile.interest_domain?.toLowerCase() || 'general';
  const domainKey = domain.includes('football') ? 'football' : 'general';

  const practiceExercises = useMemo(
    () => (domainKey === 'football' ? FOOTBALL_A1_PRACTICE : GENERAL_A1_PRACTICE),
    [domainKey]
  );

  const inputContent = INPUT_CONTENT[domainKey] || INPUT_CONTENT.general;
  const productionPrompt = PRODUCTION_PROMPTS[domainKey] || PRODUCTION_PROMPTS.general;

  // Load vocabulary on mount
  useEffect(() => {
    const vocab = loadVocabulary();
    setVocabulary(vocab);
    const due = getDueItems(vocab, 10);
    if (due.length > 0) {
      setWarmupExercises(getWarmupExercises(due));
    } else {
      setWarmupExercises(getSampleWarmup(domainKey));
    }
  }, [domainKey]);

  // Current exercises based on phase
  const currentExercises =
    currentPhase === 'warmup' ? warmupExercises : practiceExercises;
  const currentExercise = currentExercises[exerciseIndex] ?? null;

  // ─── Handlers ──────────────────────────────────────────────

  const handleAnswer = useCallback(
    (answer: string, correct: boolean) => {
      setTotalExercises((prev) => prev + 1);
      if (correct) setTotalCorrect((prev) => prev + 1);

      if (currentPhase === 'warmup') {
        const dueItems = getDueItems(vocabulary, 10);
        if (dueItems[exerciseIndex]) {
          setWarmupResults((prev) => [
            ...prev,
            { itemId: dueItems[exerciseIndex].id, correct },
          ]);
        }
      }

      if (exerciseIndex + 1 < currentExercises.length) {
        setExerciseIndex((prev) => prev + 1);
      } else {
        advancePhase();
      }
    },
    [currentPhase, exerciseIndex, currentExercises.length, vocabulary]
  );

  const advancePhase = useCallback(() => {
    setPhasesCompleted((prev) => [...prev, currentPhase]);
    const currentIdx = PHASES.indexOf(currentPhase);
    if (currentIdx + 1 < PHASES.length) {
      setCurrentPhase(PHASES[currentIdx + 1]);
      setExerciseIndex(0);
    }
  }, [currentPhase]);

  const handleProductionSubmit = useCallback(() => {
    setProductionSubmitted(true);
    setTotalExercises((prev) => prev + 1);
    setTotalCorrect((prev) => prev + 1);
  }, []);

  const finishSession = useCallback(() => {
    let updatedVocab = [...vocabulary];
    for (const result of warmupResults) {
      const idx = updatedVocab.findIndex((v) => v.id === result.itemId);
      if (idx >= 0) {
        updatedVocab[idx] = calculateNextReview(updatedVocab[idx], result.correct);
      }
    }
    saveVocabulary(updatedVocab);

    const durationMinutes = Math.round((Date.now() - sessionStartTime) / 60000);
    const acc =
      totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;

    const sessionRecord: SessionRecord = {
      id: generateId(),
      learner_id: profile.learner_id,
      date: new Date().toISOString(),
      duration_minutes: Math.max(1, durationMinutes),
      level: profile.assessed_level,
      domain: profile.interest_domain,
      phase_completed: [...phasesCompleted, 'close'],
      vocabulary_introduced: wordsLearned,
      vocabulary_reviewed: warmupResults.map((r) => r.itemId),
      grammar_topic: inputContent.title,
      exercises_completed: totalExercises,
      exercises_correct: totalCorrect,
      accuracy: acc,
      skill_focus: ['vocabulary', 'grammar', 'reading'],
      notes: '',
    };

    const history = loadSessionHistory();
    saveSessionHistory([sessionRecord, ...history]);

    const updatedProfile: LearnerProfile = {
      ...profile,
      session_count: profile.session_count + 1,
      updated_at: new Date().toISOString(),
    };
    onProfileUpdate(updatedProfile);
    onNavigate('dashboard');
  }, [
    vocabulary,
    warmupResults,
    sessionStartTime,
    totalExercises,
    totalCorrect,
    profile,
    phasesCompleted,
    wordsLearned,
    inputContent.title,
    onProfileUpdate,
    onNavigate,
  ]);

  // ─── Render Phases ─────────────────────────────────────────

  const accuracy =
    totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;

  const renderPhase = () => {
    switch (currentPhase) {
      // ── WARMUP ─────────────────────────────────────────────
      case 'warmup':
        if (warmupExercises.length === 0) {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#e58300]/10 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e58300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-[#3d6b6b]/70 mb-6 text-sm">
                No vocabulary to review yet. Let&apos;s learn something new!
              </p>
              <Button onClick={advancePhase}>Continue to Input</Button>
            </motion.div>
          );
        }
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[#3d6b6b] flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#e58300]/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e58300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                Vocabulary Review
              </h2>
            </div>
            <ExerciseCounter
              current={exerciseIndex + 1}
              total={warmupExercises.length}
            />
            <div className="mt-4">
              <AnimatePresence mode="wait">
                {currentExercise && (
                  <ExerciseCard
                    key={currentExercise.id}
                    exercise={currentExercise}
                    onAnswer={handleAnswer}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      // ── INPUT ──────────────────────────────────────────────
      case 'input':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Grammar lesson card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] overflow-hidden mb-6">
              {/* Blue header strip */}
              <div className="bg-[#e58300] px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={PHASE_ICONS.input} />
                  </svg>
                  {inputContent.title}
                </h2>
              </div>

              {/* Explanation */}
              <div className="px-6 py-5">
                <p className="text-[#3d6b6b]/70 leading-relaxed text-[15px]">
                  {inputContent.explanation}
                </p>
              </div>
            </div>

            {/* Examples */}
            <div className="space-y-3 mb-8">
              {inputContent.examples.map((ex, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-white rounded-xl shadow-sm border border-[#e7f5f5] p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-lg text-[#3d6b6b] font-semibold">
                      {ex.russian}
                    </span>
                    <AudioButton text={ex.russian} level={profile.assessed_level} />
                  </div>
                  <span className="text-sm text-[#3d6b6b]/70">
                    {ex.english}
                  </span>
                </motion.div>
              ))}
            </div>

            <Button onClick={() => {
              setWordsLearned(inputContent.examples.map((e) => e.russian));
              advancePhase();
            }}>
              Got it! Let&apos;s Practice
            </Button>
          </motion.div>
        );

      // ── PRACTICE ───────────────────────────────────────────
      case 'practice':
        return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[#3d6b6b] flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#e58300]/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e58300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={PHASE_ICONS.practice} />
                  </svg>
                </span>
                Practice
              </h2>
            </div>
            <ExerciseCounter
              current={exerciseIndex + 1}
              total={practiceExercises.length}
            />
            <div className="mt-4">
              <AnimatePresence mode="wait">
                {currentExercise && (
                  <ExerciseCard
                    key={currentExercise.id}
                    exercise={currentExercise}
                    onAnswer={handleAnswer}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      // ── PRODUCTION ─────────────────────────────────────────
      case 'production':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-[#e58300]/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e58300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={PHASE_ICONS.production} />
                </svg>
              </span>
              <h2 className="text-xl font-bold text-[#3d6b6b]">
                Your Turn!
              </h2>
            </div>

            {/* Mode toggle: segmented control */}
            <div className="flex mb-6 bg-gray-100 rounded-full p-1 w-fit">
              <button
                onClick={() => setProductionMode('writing')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  productionMode === 'writing'
                    ? 'bg-white text-[#e58300] shadow-sm'
                    : 'text-[#3d6b6b]/70 hover:text-[#3d6b6b]'
                }`}
              >
                Write
              </button>
              {sttSupported && (
                <button
                  onClick={() => setProductionMode('speaking')}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    productionMode === 'speaking'
                      ? 'bg-white text-[#e58300] shadow-sm'
                      : 'text-[#3d6b6b]/70 hover:text-[#3d6b6b]'
                  }`}
                >
                  Speak
                </button>
              )}
            </div>

            {productionMode === 'writing' ? (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-6">
                <p className="text-[#3d6b6b]/70 mb-5 text-[15px] leading-relaxed">
                  {productionPrompt.writing.prompt}
                </p>
                {productionPrompt.writing.vocabulary_to_use && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs text-[#3d6b6b]/70 self-center">
                      Try to use:
                    </span>
                    {productionPrompt.writing.vocabulary_to_use.map((w) => (
                      <span
                        key={w}
                        className="text-xs px-3 py-1 rounded-lg bg-[#e58300]/10 text-[#e58300] font-mono font-semibold border border-[#e58300]/20"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}
                <textarea
                  value={writingInput}
                  onChange={(e) => setWritingInput(e.target.value)}
                  disabled={productionSubmitted}
                  rows={4}
                  placeholder="\u041F\u0438\u0448\u0438\u0442\u0435 \u043F\u043E-\u0440\u0443\u0441\u0441\u043A\u0438..."
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white text-[#3d6b6b] placeholder:text-[#3d6b6b]/70/40 font-mono text-sm focus:outline-none focus:border-[#e58300] focus:ring-2 focus:ring-[#e58300]/20 transition-all duration-200 resize-none"
                />
                {!productionSubmitted ? (
                  <div className="mt-4">
                    <Button
                      onClick={handleProductionSubmit}
                      disabled={writingInput.trim().length < 5}
                    >
                      Submit
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-xl bg-[#4CAF50]/[0.06] border border-[#4CAF50]/20 p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <p className="text-[#4CAF50] font-semibold text-sm">
                        Gut gemacht! Nice effort!
                      </p>
                    </div>
                    <p className="text-[#3d6b6b]/70 text-xs mb-4">
                      In the full version, Claude will analyze your writing for grammar and vocabulary accuracy.
                    </p>
                    <Button size="sm" onClick={advancePhase}>
                      Continue to Summary
                    </Button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-6">
                <p className="text-[#3d6b6b]/70 mb-4 text-[15px]">
                  {productionPrompt.speaking.context}
                </p>
                <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-[#f8ffff] border border-[#e7f5f5]">
                  <span className="font-mono text-[#e58300] text-base font-semibold">
                    {productionPrompt.speaking.target_phrase}
                  </span>
                  <AudioButton
                    text={productionPrompt.speaking.target_phrase}
                    level={profile.assessed_level}
                  />
                </div>

                {!productionSubmitted ? (
                  <div className="space-y-3">
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      variant={isListening ? 'danger' : 'primary'}
                    >
                      {isListening ? 'Stop Recording' : 'Start Speaking'}
                    </Button>
                    {isListening && (
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-sm text-[#EF4444] flex items-center gap-2"
                      >
                        <motion.span
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"
                        />
                        Listening...
                      </motion.div>
                    )}
                    {transcript && (
                      <div className="p-4 rounded-xl bg-[#f8ffff] border border-[#e7f5f5]">
                        <span className="text-xs text-[#3d6b6b]/70 block mb-1 uppercase tracking-wider font-semibold">
                          You said:
                        </span>
                        <span className="text-[#3d6b6b] font-mono text-sm">
                          {transcript}
                        </span>
                      </div>
                    )}
                    {transcript && (
                      <Button onClick={handleProductionSubmit}>Submit</Button>
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl bg-[#4CAF50]/[0.06] border border-[#4CAF50]/20 p-5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <p className="text-[#4CAF50] font-semibold text-sm">
                        Great attempt!
                      </p>
                    </div>
                    <p className="text-[#3d6b6b]/70 text-xs mb-4">
                      In the full version, Claude will provide pronunciation and grammar feedback.
                    </p>
                    <Button size="sm" onClick={advancePhase}>
                      Continue to Summary
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        );

      // ── CLOSE ──────────────────────────────────────────────
      case 'close':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Large green checkmark circle */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
              className="w-24 h-24 rounded-full bg-[#4CAF50] flex items-center justify-center mx-auto mb-8 shadow-lg"
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-[#3d6b6b] mb-2"
            >
              Session Complete!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[#3d6b6b]/70 mb-10 text-[15px]"
            >
              Great work today. Here&apos;s your summary:
            </motion.p>

            {/* Stats 2x2 grid */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
              {[
                {
                  value: `${accuracy}%`,
                  label: 'Accuracy',
                  color: accuracy >= 80 ? '#4CAF50' : accuracy >= 50 ? '#F59E0B' : '#EF4444',
                  delay: 0.4,
                },
                {
                  value: totalExercises.toString(),
                  label: 'Exercises',
                  color: '#e58300',
                  delay: 0.5,
                },
                {
                  value: `${warmupResults.filter((r) => r.correct).length}/${warmupResults.length}`,
                  label: 'Words Reviewed',
                  color: '#4CAF50',
                  delay: 0.6,
                },
                {
                  value: inputContent.title.split(':')[0],
                  label: 'Grammar Topic',
                  color: '#e58300',
                  delay: 0.7,
                  isSmallText: true,
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: stat.delay, type: 'spring', stiffness: 200 }}
                  className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5 text-center"
                >
                  <p
                    className={`font-bold tabular-nums mb-1 ${stat.isSmallText ? 'text-lg' : 'text-3xl'}`}
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#3d6b6b]/70 font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-3 justify-center"
            >
              <Button onClick={finishSession}>Back to Dashboard</Button>
              <Button variant="secondary" onClick={() => {
                setCurrentPhase('warmup');
                setExerciseIndex(0);
                setTotalCorrect(0);
                setTotalExercises(0);
                setWarmupResults([]);
                setWordsLearned([]);
                setPhasesCompleted([]);
                setWritingInput('');
                setProductionSubmitted(false);
              }}>
                Another Session
              </Button>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-[#f8ffff]">
      <div className="max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-[#3d6b6b]/70 hover:text-[#3d6b6b] transition-colors text-sm flex items-center gap-1.5 group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-0.5 transition-transform"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Exit Session
          </button>
          {currentPhase !== 'close' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e58300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-xs text-[#3d6b6b]/70 tabular-nums">
                  {totalCorrect}/{totalExercises}
                </span>
              </div>
              <span
                className={`text-xs font-bold tabular-nums px-2.5 py-1 rounded-lg ${
                  accuracy >= 80
                    ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                    : accuracy >= 50
                      ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                      : 'bg-[#EF4444]/10 text-[#EF4444]'
                }`}
              >
                {accuracy}%
              </span>
            </div>
          )}
        </div>

        {/* Phase indicator */}
        <PhaseIndicator currentPhase={currentPhase} />

        {/* Phase content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Fallback sample warmup (when no vocab in storage) ───────

function getSampleWarmup(domainKey: string): Exercise[] {
  if (domainKey === 'football') {
    return [
      {
        id: 'sw-1',
        type: 'vocabulary_quiz',
        level: 'A1',
        instruction: 'What does this word mean?',
        content: {
          word: 'der Ball',
          options: ['the ball', 'the game', 'the player', 'the field'],
          correct_index: 0,
        } as VocabQuizContent,
      },
      {
        id: 'sw-2',
        type: 'vocabulary_quiz',
        level: 'A1',
        instruction: 'What does this word mean?',
        content: {
          word: 'das Tor',
          options: ['the door', 'the goal', 'the wall', 'the net'],
          correct_index: 1,
        } as VocabQuizContent,
      },
      {
        id: 'sw-3',
        type: 'vocabulary_quiz',
        level: 'A1',
        instruction: 'What does this word mean?',
        content: {
          word: 'die Mannschaft',
          options: ['the man', 'the match', 'the team', 'the stadium'],
          correct_index: 2,
        } as VocabQuizContent,
      },
      {
        id: 'sw-4',
        type: 'vocabulary_quiz',
        level: 'A1',
        instruction: 'What does this word mean?',
        content: {
          word: 'der Spieler',
          options: ['the game', 'the mirror', 'the coach', 'the player'],
          correct_index: 3,
        } as VocabQuizContent,
      },
      {
        id: 'sw-5',
        type: 'vocabulary_quiz',
        level: 'A1',
        instruction: 'What does this word mean?',
        content: {
          word: 'spielen',
          options: ['to speak', 'to play', 'to sleep', 'to eat'],
          correct_index: 1,
        } as VocabQuizContent,
      },
    ];
  }
  return [
    {
      id: 'sw-1',
      type: 'vocabulary_quiz',
      level: 'A1',
      instruction: 'What does this word mean?',
      content: {
        word: 'das Haus',
        options: ['the house', 'the mouse', 'the car', 'the tree'],
        correct_index: 0,
      } as VocabQuizContent,
    },
    {
      id: 'sw-2',
      type: 'vocabulary_quiz',
      level: 'A1',
      instruction: 'What does this word mean?',
      content: {
        word: 'die Katze',
        options: ['the dog', 'the cat', 'the bird', 'the fish'],
        correct_index: 1,
      } as VocabQuizContent,
    },
    {
      id: 'sw-3',
      type: 'vocabulary_quiz',
      level: 'A1',
      instruction: 'What does this word mean?',
      content: {
        word: 'gut',
        options: ['bad', 'fast', 'good', 'old'],
        correct_index: 2,
      } as VocabQuizContent,
    },
    {
      id: 'sw-4',
      type: 'vocabulary_quiz',
      level: 'A1',
      instruction: 'What does this word mean?',
      content: {
        word: 'trinken',
        options: ['to think', 'to eat', 'to sleep', 'to drink'],
        correct_index: 3,
      } as VocabQuizContent,
    },
    {
      id: 'sw-5',
      type: 'vocabulary_quiz',
      level: 'A1',
      instruction: 'What does this word mean?',
      content: {
        word: 'lernen',
        options: ['to learn', 'to run', 'to read', 'to write'],
        correct_index: 0,
      } as VocabQuizContent,
    },
  ];
}
