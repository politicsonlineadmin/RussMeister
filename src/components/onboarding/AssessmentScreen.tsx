'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { LearnerProfile, CEFRLevel, SkillBreakdown, SkillType } from '@/types';
import { CEFR_ORDER } from '@/types';

// ─── Types ────────────────────────────────────────────────────
interface AssessmentScreenProps {
  profile: LearnerProfile;
  onComplete: (profile: LearnerProfile) => void;
}

type AssessmentSection = 'reading' | 'writing' | 'grammar' | 'vocabulary' | 'listening';

interface MCQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface FillBlankQuestion {
  sentence: string; // ___ marks the blank
  options: string[];
  correctAnswer: string;
}

interface VocabQuestion {
  russian: string;
  options: string[];
  correctIndex: number;
  difficulty: number; // 1-3
}

interface SectionResult {
  score: number;  // 0-1
  total: number;
  correct: number;
}

// ─── Assessment Content ───────────────────────────────────────
// A1-level reading passage
const READING_PASSAGE = `\u041F\u0440\u0438\u0432\u0435\u0442! \u041C\u0435\u043D\u044F \u0437\u043E\u0432\u0443\u0442 \u0410\u043D\u043D\u0430. \u041C\u043D\u0435 25 \u043B\u0435\u0442, \u0438 \u044F \u0438\u0437 \u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433\u0430. \u0421\u0435\u0439\u0447\u0430\u0441 \u044F \u0436\u0438\u0432\u0443 \u0432 \u041C\u043E\u0441\u043A\u0432\u0435. \u042F \u0440\u0430\u0431\u043E\u0442\u0430\u044E \u0432 \u043A\u0430\u0444\u0435. \u041C\u043E\u044F \u0440\u0430\u0431\u043E\u0442\u0430 \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F \u0432 \u0432\u043E\u0441\u0435\u043C\u044C \u0443\u0442\u0440\u0430. \u042F \u043B\u044E\u0431\u043B\u044E \u043F\u0438\u0442\u044C \u043A\u043E\u0444\u0435 \u0438 \u0435\u0441\u0442\u044C \u0442\u043E\u0440\u0442. \u0412 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0435 \u044F \u043B\u044E\u0431\u043B\u044E \u0433\u0443\u043B\u044F\u0442\u044C. \u041C\u043E\u044F \u0441\u043E\u0431\u0430\u043A\u0430 \u041C\u0430\u043A\u0441 \u0432\u0441\u0435\u0433\u0434\u0430 \u0438\u0434\u0451\u0442 \u0441\u043E \u043C\u043D\u043E\u0439. \u0415\u043C\u0443 \u0442\u0440\u0438 \u0433\u043E\u0434\u0430, \u0438 \u043E\u043D \u043E\u0447\u0435\u043D\u044C \u0434\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u044B\u0439.`;

const READING_QUESTIONS: MCQuestion[] = [
  {
    question: 'Where does Anna live now?',
    options: ['Saint Petersburg', 'Moscow', 'Kazan', 'Novosibirsk'],
    correctIndex: 1,
  },
  {
    question: 'Where does Anna work?',
    options: ['In a school', 'In a hospital', 'In a caf\u00e9', 'In an office'],
    correctIndex: 2,
  },
  {
    question: 'What does Anna like to do on weekends?',
    options: ['Read books', 'Go for walks', 'Watch TV', 'Cook dinner'],
    correctIndex: 1,
  },
];

const GRAMMAR_QUESTIONS: FillBlankQuestion[] = [
  {
    sentence: '\u042F ___ \u0440\u0443\u0441\u0441\u043A\u0438\u0439 \u044F\u0437\u044B\u043A.',
    options: ['\u0443\u0447\u0443', '\u0443\u0447\u0438\u0448\u044C', '\u0443\u0447\u0438\u0442', '\u0443\u0447\u0438\u043C'],
    correctAnswer: '\u0443\u0447\u0443',
  },
  {
    sentence: '\u042D\u0442\u043E ___ \u043A\u043D\u0438\u0433\u0430.',
    options: ['\u043C\u043E\u0439', '\u043C\u043E\u044F', '\u043C\u043E\u0451', '\u043C\u043E\u0438'],
    correctAnswer: '\u043C\u043E\u044F',
  },
  {
    sentence: '\u041E\u043D ___ \u043D\u0430 \u0440\u0430\u0431\u043E\u0442\u0443 \u043A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C.',
    options: ['\u0438\u0434\u0451\u0442', '\u0438\u0434\u0443', '\u0438\u0434\u0451\u0448\u044C', '\u0438\u0434\u0443\u0442'],
    correctAnswer: '\u0438\u0434\u0451\u0442',
  },
  {
    sentence: '\u042F \u0434\u0430\u044E \u043A\u043D\u0438\u0433\u0443 ___.',
    options: ['\u0434\u0440\u0443\u0433', '\u0434\u0440\u0443\u0433\u0430', '\u0434\u0440\u0443\u0433\u0443', '\u0434\u0440\u0443\u0433\u043E\u043C'],
    correctAnswer: '\u0434\u0440\u0443\u0433\u0443',
  },
  {
    sentence: '\u041C\u044B \u0436\u0438\u0432\u0451\u043C \u0432 ___ \u0434\u043E\u043C\u0435.',
    options: ['\u0431\u043E\u043B\u044C\u0448\u043E\u0439', '\u0431\u043E\u043B\u044C\u0448\u043E\u043C', '\u0431\u043E\u043B\u044C\u0448\u0430\u044F', '\u0431\u043E\u043B\u044C\u0448\u043E\u0435'],
    correctAnswer: '\u0431\u043E\u043B\u044C\u0448\u043E\u043C',
  },
];

const VOCAB_QUESTIONS: VocabQuestion[] = [
  { russian: '\u0441\u043E\u0431\u0430\u043A\u0430', options: ['Cat', 'Dog', 'Bird', 'Fish'], correctIndex: 1, difficulty: 1 },
  { russian: '\u0432\u043E\u0434\u0430', options: ['Water', 'Wine', 'Juice', 'Milk'], correctIndex: 0, difficulty: 1 },
  { russian: '\u0434\u043E\u043C', options: ['Car', 'Tree', 'House', 'Street'], correctIndex: 2, difficulty: 1 },
  { russian: '\u0445\u043B\u0435\u0431', options: ['Butter', 'Cheese', 'Meat', 'Bread'], correctIndex: 3, difficulty: 1 },
  { russian: '\u0448\u043A\u043E\u043B\u0430', options: ['Church', 'School', 'Hospital', 'Library'], correctIndex: 1, difficulty: 1 },
  { russian: '\u0440\u0430\u0431\u043E\u0442\u0430', options: ['Money', 'Time', 'Work', 'Life'], correctIndex: 2, difficulty: 2 },
  { russian: '\u0434\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u044B\u0439', options: ['Friendly', 'Beautiful', 'Dangerous', 'Boring'], correctIndex: 0, difficulty: 2 },
  { russian: '\u043D\u0430\u0447\u0438\u043D\u0430\u0442\u044C', options: ['To stop', 'To begin', 'To sleep', 'To eat'], correctIndex: 1, difficulty: 2 },
  { russian: '\u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C', options: ['Always', 'Never', 'Perhaps', 'Often'], correctIndex: 2, difficulty: 3 },
  { russian: '\u0438\u0437\u0432\u0438\u043D\u0438\u0442\u0435', options: ['Thank you', 'Goodbye', 'Please', 'Excuse me'], correctIndex: 3, difficulty: 3 },
];

const LISTENING_SENTENCE = '\u0414\u043E\u0431\u0440\u044B\u0439 \u0434\u0435\u043D\u044C, \u044F \u0445\u043E\u0442\u0435\u043B \u0431\u044B \u043A\u043E\u0444\u0435, \u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430.';

const LISTENING_QUESTION: MCQuestion = {
  question: 'What was said?',
  options: [
    'Good morning, I would like a tea please.',
    'Good day, I would like a coffee please.',
    'Good evening, I would like water please.',
    'Good day, I would like cake please.',
  ],
  correctIndex: 1,
};

const WRITING_PROMPT_TEMPLATE = (domain: string) =>
  `Write 2-3 simple sentences in Russian about "${domain}". Use any vocabulary you know. Don't worry about mistakes!`;

const SECTION_ORDER: AssessmentSection[] = ['reading', 'writing', 'grammar', 'vocabulary', 'listening'];

const SECTION_INFO: Record<AssessmentSection, { title: string; icon: string; description: string }> = {
  reading: {
    title: 'Reading Comprehension',
    icon: '\uD83D\uDCD6',
    description: 'Read a short Russian text and answer questions to test your understanding.',
  },
  writing: {
    title: 'Writing',
    icon: '\u270D\uFE0F',
    description: 'Write a few sentences in Russian. We want to see what you can produce, even if imperfect!',
  },
  grammar: {
    title: 'Grammar',
    icon: '\uD83D\uDD24',
    description: 'Fill in the blanks to test verb conjugation, cases, and gender agreement.',
  },
  vocabulary: {
    title: 'Vocabulary',
    icon: '\uD83D\uDCDA',
    description: 'Translate Russian words to English. Questions get progressively harder.',
  },
  listening: {
    title: 'Listening',
    icon: '\uD83C\uDFA7',
    description: 'Listen to a Russian sentence and identify what was said.',
  },
};

// ─── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        className="h-full bg-[#e58300] rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function AssessmentScreen({ profile, onComplete }: AssessmentScreenProps) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'questions'>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [writingText, setWritingText] = useState('');
  const [results, setResults] = useState<Partial<Record<AssessmentSection, SectionResult>>>({});
  const [showResults, setShowResults] = useState(false);

  // Track correct answers per section
  const sectionCorrectRef = useRef(0);
  const sectionTotalRef = useRef(0);

  const currentSection = SECTION_ORDER[sectionIndex];
  const totalSections = SECTION_ORDER.length;
  const overallProgress = sectionIndex + (phase === 'questions' ? 0.5 : 0);

  // ─── TTS Helper ───────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Clean up TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ─── Section Transitions ──────────────────────────────────────
  const startSection = () => {
    setPhase('questions');
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    sectionCorrectRef.current = 0;
    sectionTotalRef.current = 0;
  };

  const finishSection = (result: SectionResult) => {
    setResults((prev) => ({ ...prev, [currentSection]: result }));

    if (sectionIndex < totalSections - 1) {
      setSectionIndex((i) => i + 1);
      setPhase('intro');
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswerLocked(false);
    } else {
      setShowResults(true);
    }
  };

  // ─── Answer Handlers ──────────────────────────────────────────
  const handleMCSelect = (index: number, correctIndex: number, totalQuestions: number) => {
    if (isAnswerLocked) return;
    setSelectedAnswer(index);
    setIsAnswerLocked(true);

    sectionTotalRef.current += 1;
    if (index === correctIndex) {
      sectionCorrectRef.current += 1;
    }

    // Auto-advance after a short delay
    setTimeout(() => {
      if (questionIndex < totalQuestions - 1) {
        setQuestionIndex((q) => q + 1);
        setSelectedAnswer(null);
        setIsAnswerLocked(false);
      } else {
        finishSection({
          score: sectionCorrectRef.current / sectionTotalRef.current,
          total: sectionTotalRef.current,
          correct: sectionCorrectRef.current,
        });
      }
    }, 1000);
  };

  const handleFillBlankSelect = (option: string, correctAnswer: string, totalQuestions: number) => {
    if (isAnswerLocked) return;
    setSelectedAnswer(option);
    setIsAnswerLocked(true);

    sectionTotalRef.current += 1;
    if (option === correctAnswer) {
      sectionCorrectRef.current += 1;
    }

    setTimeout(() => {
      if (questionIndex < totalQuestions - 1) {
        setQuestionIndex((q) => q + 1);
        setSelectedAnswer(null);
        setIsAnswerLocked(false);
      } else {
        finishSection({
          score: sectionCorrectRef.current / sectionTotalRef.current,
          total: sectionTotalRef.current,
          correct: sectionCorrectRef.current,
        });
      }
    }, 1000);
  };

  const handleWritingSubmit = () => {
    const text = writingText.trim();
    // Simple heuristic scoring for writing
    let score = 0;
    if (text.length > 0) score += 0.2;
    if (text.length > 20) score += 0.2;
    if (text.split(/[.!?]+/).filter(Boolean).length >= 2) score += 0.2;
    // Check for some Russian-like patterns
    const russianPatterns = [/[\u0430-\u044F\u0410-\u042F\u0451\u0401]+/gi];
    const russianWordCount = russianPatterns.reduce(
      (acc, pat) => acc + (text.match(pat)?.length ?? 0),
      0
    );
    if (russianWordCount >= 2) score += 0.2;
    if (russianWordCount >= 5) score += 0.2;

    finishSection({
      score: Math.min(1, score),
      total: 1,
      correct: score >= 0.6 ? 1 : 0,
    });
  };

  // ─── Compute Final Assessment ─────────────────────────────────
  const computeAssessment = useCallback(() => {
    const readingScore = results.reading?.score ?? 0;
    const writingScore = results.writing?.score ?? 0;
    const grammarScore = results.grammar?.score ?? 0;
    const vocabScore = results.vocabulary?.score ?? 0;
    const listeningScore = results.listening?.score ?? 0;

    const scoreToLevel = (score: number, baseLevel: CEFRLevel): CEFRLevel => {
      const baseIdx = CEFR_ORDER.indexOf(baseLevel);
      if (score >= 0.9) return CEFR_ORDER[Math.min(baseIdx + 1, 5)];
      if (score >= 0.7) return baseLevel;
      if (score >= 0.4) return CEFR_ORDER[Math.max(baseIdx - 1, 0)];
      return CEFR_ORDER[Math.max(baseIdx - 1, 0)];
    };

    const base = profile.assessed_level;

    const skillBreakdown: SkillBreakdown = {
      reading: scoreToLevel(readingScore, base),
      writing: scoreToLevel(writingScore, base),
      grammar: scoreToLevel(grammarScore, base),
      vocabulary: scoreToLevel(vocabScore, base),
      listening: scoreToLevel(listeningScore, base),
      speaking: base, // Not assessed yet
    };

    // Overall level = median of skills
    const skillLevels = Object.values(skillBreakdown).map((l) => CEFR_ORDER.indexOf(l));
    skillLevels.sort((a, b) => a - b);
    const medianIdx = skillLevels[Math.floor(skillLevels.length / 2)];
    const assessedLevel = CEFR_ORDER[medianIdx];

    // Determine weak and strong areas
    const weak: SkillType[] = [];
    const strong: SkillType[] = [];
    const scores: Record<SkillType, number> = {
      reading: readingScore,
      writing: writingScore,
      grammar: grammarScore,
      vocabulary: vocabScore,
      listening: listeningScore,
      speaking: 0.5, // Neutral since not tested
    };

    for (const [skill, score] of Object.entries(scores) as [SkillType, number][]) {
      if (score < 0.5) weak.push(skill);
      else if (score >= 0.8) strong.push(skill);
    }

    const now = new Date().toISOString();
    const updatedProfile: LearnerProfile = {
      ...profile,
      assessed_level: assessedLevel,
      skill_breakdown: skillBreakdown,
      weak_areas: weak,
      strong_areas: strong,
      updated_at: now,
    };

    onComplete(updatedProfile);
  }, [results, profile, onComplete]);

  // ─── Helper: MC option color class ────────────────────────────
  const getOptionColorClass = (
    isSelected: boolean,
    isCorrect: boolean,
    showFeedback: boolean
  ) => {
    if (showFeedback && isSelected && isCorrect) {
      return 'bg-emerald-50 border-emerald-400 text-emerald-800';
    }
    if (showFeedback && isSelected && !isCorrect) {
      return 'bg-red-50 border-red-400 text-red-800';
    }
    if (showFeedback && isCorrect) {
      return 'bg-emerald-50/60 border-emerald-300 text-emerald-700';
    }
    return 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm text-[#3d6b6b]';
  };

  // ─── Section Renderers ────────────────────────────────────────

  const renderIntro = () => {
    const info = SECTION_INFO[currentSection];
    return (
      <div
        key={`intro-${currentSection}`}
        className="flex flex-col items-center text-center px-6 max-w-md mx-auto animate-fadeIn"
      >
        <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-5">
          <span className="text-4xl">{info.icon}</span>
        </div>
        <h2 className="text-2xl font-bold text-[#3d6b6b] mb-3">{info.title}</h2>
        <p className="text-[#3d6b6b]/60 mb-8 leading-relaxed">{info.description}</p>
        <button
          onClick={startSection}
          className="px-8 py-3 bg-[#e58300] text-white font-semibold rounded-full hover:bg-[#cc7400] transition-colors duration-200 shadow-sm"
        >
          Start Section
        </button>
      </div>
    );
  };

  const renderReading = () => (
    <div
      key="reading-questions"
      className="px-6 max-w-lg mx-auto animate-fadeIn"
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <p className="text-[#3d6b6b]/80 leading-relaxed text-[15px] whitespace-pre-wrap">{READING_PASSAGE}</p>
      </div>

      <div className="mb-3 text-sm text-[#3d6b6b]/50">
        Question {questionIndex + 1} of {READING_QUESTIONS.length}
      </div>

      <div key={questionIndex} className="animate-fadeIn">
        <h3 className="text-lg font-medium text-[#3d6b6b] mb-4">
          {READING_QUESTIONS[questionIndex].question}
        </h3>
        <div className="space-y-2.5">
          {READING_QUESTIONS[questionIndex].options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === READING_QUESTIONS[questionIndex].correctIndex;
            const showFeedback = isAnswerLocked;

            return (
              <button
                key={i}
                onClick={() =>
                  handleMCSelect(i, READING_QUESTIONS[questionIndex].correctIndex, READING_QUESTIONS.length)
                }
                disabled={isAnswerLocked}
                className={`w-full text-left px-4 py-3 rounded-2xl border transition-all duration-200 ${getOptionColorClass(isSelected, isCorrect, showFeedback)} ${isAnswerLocked ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderWriting = () => (
    <div
      key="writing-questions"
      className="px-6 max-w-lg mx-auto animate-fadeIn"
    >
      <h3 className="text-lg font-medium text-[#3d6b6b] mb-3">
        {WRITING_PROMPT_TEMPLATE(profile.interest_domain)}
      </h3>
      <p className="text-[#3d6b6b]/50 text-sm mb-5">
        Tip: Try using simple sentences like &quot;\u042F \u043B\u044E\u0431\u043B\u044E...&quot; or &quot;\u042D\u0442\u043E...&quot;.
      </p>

      <textarea
        value={writingText}
        onChange={(e) => setWritingText(e.target.value)}
        placeholder="\u041F\u0438\u0448\u0438\u0442\u0435 \u0437\u0434\u0435\u0441\u044C \u043F\u043E-\u0440\u0443\u0441\u0441\u043A\u0438..."
        rows={5}
        autoFocus
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[#3d6b6b] placeholder:text-[#3d6b6b]/50 focus:outline-none focus:border-[#e58300] focus:ring-2 focus:ring-[#e58300]/20 transition-all duration-200 resize-none text-[15px] leading-relaxed shadow-sm"
      />

      <div className="flex items-center justify-between mt-4">
        <span className="text-[#3d6b6b]/50 text-sm">
          {writingText.trim().length > 0
            ? `${writingText.trim().split(/\s+/).length} words`
            : 'Start typing...'}
        </span>
        <button
          onClick={handleWritingSubmit}
          disabled={writingText.trim().length < 5}
          className="px-6 py-2.5 bg-[#e58300] text-white font-semibold rounded-full hover:bg-[#cc7400] transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
        >
          Submit
        </button>
      </div>
    </div>
  );

  const renderGrammar = () => {
    const q = GRAMMAR_QUESTIONS[questionIndex];
    return (
      <div
        key="grammar-questions"
        className="px-6 max-w-lg mx-auto animate-fadeIn"
      >
        <div className="mb-3 text-sm text-[#3d6b6b]/50">
          Question {questionIndex + 1} of {GRAMMAR_QUESTIONS.length}
        </div>

        <div key={questionIndex} className="animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
            <p className="text-xl text-[#3d6b6b] font-medium text-center">
              {q.sentence.split('___').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block w-20 border-b-2 border-[#e58300]/60 mx-1" />
                  )}
                </span>
              ))}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt) => {
              const isSelected = selectedAnswer === opt;
              const isCorrect = opt === q.correctAnswer;
              const showFeedback = isAnswerLocked;

              return (
                <button
                  key={opt}
                  onClick={() =>
                    handleFillBlankSelect(opt, q.correctAnswer, GRAMMAR_QUESTIONS.length)
                  }
                  disabled={isAnswerLocked}
                  className={`px-4 py-3 rounded-2xl border transition-all duration-200 font-medium text-center ${getOptionColorClass(isSelected, isCorrect, showFeedback)} ${isAnswerLocked ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderVocabulary = () => {
    const q = VOCAB_QUESTIONS[questionIndex];
    return (
      <div
        key="vocabulary-questions"
        className="px-6 max-w-lg mx-auto animate-fadeIn"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[#3d6b6b]/50">
            Question {questionIndex + 1} of {VOCAB_QUESTIONS.length}
          </span>
          <span className="text-xs text-[#3d6b6b]/50">
            {'*'.repeat(q.difficulty)}{'*'.repeat(0)}
          </span>
        </div>

        <div key={questionIndex} className="animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <p className="text-xs text-[#3d6b6b]/50 uppercase tracking-wider mb-2">Translate to English</p>
            <p className="text-3xl font-bold text-[#e58300]">{q.russian}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === q.correctIndex;
              const showFeedback = isAnswerLocked;

              return (
                <button
                  key={i}
                  onClick={() => handleMCSelect(i, q.correctIndex, VOCAB_QUESTIONS.length)}
                  disabled={isAnswerLocked}
                  className={`px-4 py-3 rounded-2xl border transition-all duration-200 text-center ${getOptionColorClass(isSelected, isCorrect, showFeedback)} ${isAnswerLocked ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderListening = () => (
    <div
      key="listening-questions"
      className="px-6 max-w-lg mx-auto animate-fadeIn"
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
        <p className="text-[#3d6b6b]/60 text-sm mb-4">Click to play the sentence</p>
        <button
          onClick={() => speak(LISTENING_SENTENCE)}
          className="w-20 h-20 rounded-full bg-[#e58300] flex items-center justify-center mx-auto shadow-lg shadow-[#e58300]/25 hover:bg-[#cc7400] transition-all duration-200 active:scale-95"
        >
          <svg
            className="w-8 h-8 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <p className="text-[#3d6b6b]/50 text-xs mt-3">You can play it multiple times</p>
      </div>

      <h3 className="text-lg font-medium text-[#3d6b6b] mb-4">{LISTENING_QUESTION.question}</h3>

      <div className="space-y-2.5">
        {LISTENING_QUESTION.options.map((opt, i) => {
          const isSelected = selectedAnswer === i;
          const isCorrect = i === LISTENING_QUESTION.correctIndex;
          const showFeedback = isAnswerLocked;

          return (
            <button
              key={i}
              onClick={() => handleMCSelect(i, LISTENING_QUESTION.correctIndex, 1)}
              disabled={isAnswerLocked}
              className={`w-full text-left px-4 py-3 rounded-2xl border transition-all duration-200 text-sm ${getOptionColorClass(isSelected, isCorrect, showFeedback)} ${isAnswerLocked ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── Results Screen ─────────────────────────────────────────────
  const renderResults = () => {
    const sections = Object.entries(results) as [AssessmentSection, SectionResult][];
    const avgScore =
      sections.reduce((sum, [, r]) => sum + r.score, 0) / Math.max(sections.length, 1);

    return (
      <div
        key="results"
        className="px-6 max-w-md mx-auto text-center animate-fadeIn"
      >
        <div className="text-5xl mb-4">
          {avgScore >= 0.8 ? '\uD83C\uDF1F' : avgScore >= 0.5 ? '\uD83D\uDC4D' : '\uD83D\uDCAA'}
        </div>
        <h2 className="text-2xl font-bold text-[#3d6b6b] mb-2">Assessment Complete!</h2>
        <p className="text-[#3d6b6b]/60 mb-8">
          Great job, {profile.name.split(' ')[0]}! Here&apos;s how you did:
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 mb-8 shadow-sm">
          {SECTION_ORDER.map((section) => {
            const r = results[section];
            if (!r) return null;
            const info = SECTION_INFO[section];
            const pct = Math.round(r.score * 100);

            return (
              <div key={section} className="flex items-center gap-3">
                <span className="text-xl w-8">{info.icon}</span>
                <div className="flex-1 text-left">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#3d6b6b]/80">{info.title}</span>
                    <span
                      className={`font-semibold ${
                        pct >= 70
                          ? 'text-emerald-600'
                          : pct >= 40
                          ? 'text-amber-600'
                          : 'text-red-500'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        pct >= 70
                          ? 'bg-emerald-500'
                          : pct >= 40
                          ? 'bg-amber-500'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={computeAssessment}
          className="w-full px-8 py-3.5 bg-[#e58300] text-white font-semibold rounded-full hover:bg-[#cc7400] transition-all duration-200 shadow-lg shadow-[#e58300]/25 text-lg active:scale-[0.97]"
        >
          Continue to Dashboard
        </button>
      </div>
    );
  };

  // ─── Section Router ─────────────────────────────────────────────
  const renderCurrentSection = () => {
    if (showResults) return renderResults();
    if (phase === 'intro') return renderIntro();

    switch (currentSection) {
      case 'reading':
        return renderReading();
      case 'writing':
        return renderWriting();
      case 'grammar':
        return renderGrammar();
      case 'vocabulary':
        return renderVocabulary();
      case 'listening':
        return renderListening();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8ffff] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-[#3d6b6b]">Baseline Assessment</h1>
          <span className="text-sm text-[#3d6b6b]/50">
            {showResults
              ? 'Complete'
              : `Section ${sectionIndex + 1}/${totalSections}`}
          </span>
        </div>
        <ProgressBar value={showResults ? totalSections : overallProgress} max={totalSections} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center py-8">
        {renderCurrentSection()}
      </div>

      {/* Global fadeIn animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}
