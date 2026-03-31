'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Exercise,
  VocabQuizContent,
  FillBlankContent,
  SentenceBuildContent,
  TranslationContent,
} from '@/types';
import Button from '@/components/ui/Button';
import AudioButton from '@/components/ui/AudioButton';

interface ExerciseCardProps {
  exercise: Exercise;
  onAnswer: (answer: string, correct: boolean) => void;
}

// ─── Shared Constants ───────────────────────────────────────

const CARD_CONTAINER =
  'bg-white rounded-2xl shadow-sm border border-[#e7f5f5]';

const OPTION_BASE =
  'w-full text-left px-5 py-4 rounded-xl border text-[15px] font-medium transition-all duration-200 cursor-pointer disabled:cursor-default';

const OPTION_IDLE =
  'bg-white border-gray-200 text-[#3d6b6b] hover:bg-[#e58300]/[0.04] hover:border-[#e58300]/40 hover:shadow-sm';

// ─── Icons ──────────────────────────────────────────────────

function CheckIcon() {
  return (
    <motion.svg
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4CAF50"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <polyline points="20 6 9 17 4 12" />
    </motion.svg>
  );
}

function XIcon() {
  return (
    <motion.svg
      initial={{ scale: 0, rotate: 90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#EF4444"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </motion.svg>
  );
}

function RussianFlagIcon() {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" className="shrink-0 rounded-[2px] overflow-hidden">
      <rect y="0" width="24" height="5.33" fill="#FFFFFF" />
      <rect y="5.33" width="24" height="5.33" fill="#0039A6" />
      <rect y="10.66" width="24" height="5.34" fill="#D52B1E" />
    </svg>
  );
}

// ─── Feedback Overlay ────────────────────────────────────────

function FeedbackOverlay({
  correct,
  correctAnswer,
}: {
  correct: boolean;
  correctAnswer?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`mt-5 rounded-xl px-5 py-4 text-sm font-medium flex items-center gap-3 ${
        correct
          ? 'bg-[#4CAF50]/10 border border-[#4CAF50]/25'
          : 'bg-[#EF4444]/10 border border-[#EF4444]/25'
      }`}
    >
      {correct ? (
        <>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#4CAF50" fillOpacity="0.15" stroke="#4CAF50" strokeWidth="1.5" />
              <polyline points="8 12 11 15 16 9" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
          <div>
            <span className="text-[#4CAF50] font-semibold">{'\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E!'}</span>
            <span className="text-[#4CAF50]/70 ml-1">Well done.</span>
          </div>
        </>
      ) : (
        <>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#EF4444" fillOpacity="0.15" stroke="#EF4444" strokeWidth="1.5" />
              <line x1="9" y1="9" x2="15" y2="15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              <line x1="15" y1="9" x2="9" y2="15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.span>
          <div>
            <span className="text-[#EF4444] font-semibold">{'\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E.'}</span>
            {correctAnswer && (
              <span className="text-[#3d6b6b]/70 ml-1">
                Correct:{' '}
                <span className="font-mono font-bold text-[#4CAF50]">{correctAnswer}</span>
              </span>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Vocab Quiz ──────────────────────────────────────────────

function VocabQuiz({
  exercise,
  content,
  onAnswer,
}: {
  exercise: Exercise;
  content: VocabQuizContent;
  onAnswer: (answer: string, correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const isCorrect = selected === content.correct_index;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === content.correct_index;
    setTimeout(() => {
      onAnswer(content.options[idx], correct);
    }, 1200);
  };

  return (
    <div>
      {/* Image (if available) */}
      {content.image && (
        <div className="flex justify-center mb-6">
          <img
            src={content.image}
            alt={content.word}
            className="rounded-xl object-cover shadow-sm"
            style={{ maxHeight: 200, maxWidth: '100%' }}
          />
        </div>
      )}

      {/* Russian word display */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl sm:text-5xl font-bold text-[#3d6b6b] tracking-tight"
        >
          {content.word}
        </motion.span>
        <AudioButton text={content.word} level={exercise.level} />
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-1 gap-3">
        {content.options.map((option, idx) => {
          let optionStyle = OPTION_IDLE;
          let icon = null;

          if (answered) {
            if (idx === content.correct_index) {
              optionStyle =
                'bg-[#4CAF50]/10 border-[#4CAF50]/50 text-[#4CAF50]';
              icon = <CheckIcon />;
            } else if (idx === selected) {
              optionStyle =
                'bg-[#EF4444]/10 border-[#EF4444]/50 text-[#EF4444]';
              icon = <XIcon />;
            } else {
              optionStyle =
                'bg-[#e7f5f5] border-[#e7f5f5] text-[#3d6b6b]/30';
            }
          }

          return (
            <motion.button
              key={idx}
              whileHover={!answered ? { scale: 1.015, y: -2 } : {}}
              whileTap={!answered ? { scale: 0.98 } : {}}
              animate={
                answered && idx === selected && !isCorrect
                  ? {
                      x: [0, -6, 6, -4, 4, 0],
                      transition: { duration: 0.4 },
                    }
                  : {}
              }
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={`${OPTION_BASE} ${optionStyle} flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#f8ffff] flex items-center justify-center text-xs font-bold text-[#3d6b6b]/70 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </div>
              {icon}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <FeedbackOverlay
            correct={isCorrect}
            correctAnswer={
              !isCorrect ? content.options[content.correct_index] : undefined
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Fill in the Blank ───────────────────────────────────────

function FillBlank({
  content,
  onAnswer,
}: {
  content: FillBlankContent;
  onAnswer: (answer: string, correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const isCorrect = selected === content.correct_answer;

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    const correct = option === content.correct_answer;
    setTimeout(() => {
      onAnswer(option, correct);
    }, 1200);
  };

  const parts = content.sentence.split('___');

  return (
    <div>
      {/* Sentence with highlighted blank */}
      <div className="rounded-xl bg-[#f8ffff] border border-[#e7f5f5] px-6 py-5 mb-6">
        <p className="text-xl sm:text-2xl text-[#3d6b6b] font-mono leading-relaxed">
          {parts[0]}
          <motion.span
            animate={
              answered
                ? {}
                : {
                    borderColor: [
                      '#e58300',
                      '#e5830080',
                      '#e58300',
                    ],
                  }
            }
            transition={{ repeat: Infinity, duration: 2 }}
            className={`inline-block min-w-[100px] mx-1.5 px-3 py-1 rounded-lg text-center font-bold ${
              answered
                ? isCorrect
                  ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-b-2 border-[#4CAF50]'
                  : 'bg-[#EF4444]/10 text-[#EF4444] border-b-2 border-[#EF4444]'
                : selected
                  ? 'bg-[#e58300]/10 text-[#e58300] border-b-2 border-[#e58300]'
                  : 'bg-white text-[#3d6b6b]/70 border-b-2 border-[#e58300]'
            }`}
          >
            {selected ?? '___'}
          </motion.span>
          {parts[1]}
        </p>
      </div>

      {/* Option pills */}
      <div className="flex flex-wrap gap-3">
        {content.options.map((option) => {
          let style = OPTION_IDLE;
          let icon = null;

          if (answered) {
            if (option === content.correct_answer) {
              style =
                'bg-[#4CAF50]/10 border-[#4CAF50]/50 text-[#4CAF50]';
              icon = <CheckIcon />;
            } else if (option === selected) {
              style =
                'bg-[#EF4444]/10 border-[#EF4444]/50 text-[#EF4444]';
              icon = <XIcon />;
            } else {
              style =
                'bg-[#e7f5f5] border-[#e7f5f5] text-[#3d6b6b]/30';
            }
          }

          return (
            <motion.button
              key={option}
              whileHover={!answered ? { scale: 1.05, y: -2 } : {}}
              whileTap={!answered ? { scale: 0.95 } : {}}
              animate={
                answered && option === selected && !isCorrect
                  ? { x: [0, -5, 5, -3, 3, 0], transition: { duration: 0.4 } }
                  : {}
              }
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={`px-5 py-3 rounded-full border text-[15px] font-semibold transition-all duration-200 cursor-pointer disabled:cursor-default flex items-center gap-2 ${style}`}
            >
              <span>{option}</span>
              {icon}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <FeedbackOverlay
            correct={isCorrect}
            correctAnswer={!isCorrect ? content.correct_answer : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sentence Build ──────────────────────────────────────────

function SentenceBuild({
  content,
  onAnswer,
}: {
  content: SentenceBuildContent;
  onAnswer: (answer: string, correct: boolean) => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>(() =>
    [...content.words].sort(() => Math.random() - 0.5)
  );
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleTapWord = (word: string, idx: number) => {
    if (answered) return;
    const newRemaining = [...remaining];
    newRemaining.splice(idx, 1);
    setRemaining(newRemaining);
    setPlaced([...placed, word]);
  };

  const handleRemoveWord = (word: string, idx: number) => {
    if (answered) return;
    const newPlaced = [...placed];
    newPlaced.splice(idx, 1);
    setPlaced(newPlaced);
    setRemaining([...remaining, word]);
  };

  const handleSubmit = () => {
    const answer = placed.join(' ');
    const correct = answer === content.correct_order;
    setIsCorrect(correct);
    setAnswered(true);
    setTimeout(() => {
      onAnswer(answer, correct);
    }, 1500);
  };

  return (
    <div>
      {/* Sentence building area (drop zone) */}
      <div
        className={`min-h-[72px] mb-5 p-4 rounded-xl border-2 border-dashed flex flex-wrap gap-2.5 items-center transition-all duration-300 ${
          answered
            ? isCorrect
              ? 'border-[#4CAF50]/40 bg-[#4CAF50]/[0.04]'
              : 'border-[#EF4444]/40 bg-[#EF4444]/[0.04]'
            : 'border-gray-300 bg-[#f8ffff]'
        }`}
      >
        {placed.length === 0 && (
          <span className="text-[#3d6b6b]/70/60 text-sm italic px-1">
            Tap words below to build the sentence...
          </span>
        )}
        {placed.map((word, idx) => (
          <motion.button
            key={`placed-${idx}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={!answered ? { scale: 1.05 } : {}}
            whileTap={!answered ? { scale: 0.9 } : {}}
            onClick={() => handleRemoveWord(word, idx)}
            disabled={answered}
            className="px-4 py-2 rounded-lg bg-[#e58300]/10 text-[#e58300] text-sm font-semibold border border-[#e58300]/30 cursor-pointer disabled:cursor-default shadow-sm transition-shadow"
          >
            {word}
          </motion.button>
        ))}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {remaining.map((word, idx) => (
          <motion.button
            key={`remaining-${idx}`}
            layout
            whileHover={!answered ? { scale: 1.06, y: -3 } : {}}
            whileTap={!answered ? { scale: 0.94 } : {}}
            onClick={() => handleTapWord(word, idx)}
            disabled={answered}
            className="px-4 py-2 rounded-lg bg-white text-[#3d6b6b] text-sm font-medium border border-gray-200 hover:border-[#e58300]/40 cursor-pointer disabled:cursor-default disabled:opacity-30 transition-all duration-200 shadow-sm hover:shadow"
          >
            {word}
          </motion.button>
        ))}
      </div>

      {!answered && placed.length > 0 && (
        <Button size="sm" onClick={handleSubmit}>
          Check Answer
        </Button>
      )}

      <AnimatePresence>
        {answered && (
          <FeedbackOverlay
            correct={isCorrect}
            correctAnswer={!isCorrect ? content.correct_order : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Translation ─────────────────────────────────────────────

function Translation({
  content,
  onAnswer,
}: {
  content: TranslationContent;
  onAnswer: (answer: string, correct: boolean) => void;
}) {
  const [input, setInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!input.trim() || answered) return;
    const normalized = input.trim().toLowerCase().replace(/[.!?]/g, '');
    const correctNormalized = content.correct_translation
      .toLowerCase()
      .replace(/[.!?]/g, '');
    const correct = normalized === correctNormalized;
    setIsCorrect(correct);
    setAnswered(true);
    setTimeout(() => {
      onAnswer(input.trim(), correct);
    }, 1500);
  };

  return (
    <div>
      {/* Source text */}
      <div className="rounded-xl bg-[#f8ffff] border border-[#e7f5f5] px-6 py-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          {content.source_language === 'en' ? (
            <span className="text-xs uppercase tracking-widest text-[#3d6b6b]/70 font-semibold">English</span>
          ) : (
            <div className="flex items-center gap-2">
              <RussianFlagIcon />
              <span className="text-xs uppercase tracking-widest text-[#3d6b6b]/70 font-semibold">Русский</span>
            </div>
          )}
        </div>
        <p className="text-xl sm:text-2xl text-[#3d6b6b] font-medium leading-relaxed">
          {content.source}
        </p>
      </div>

      {/* Translation input */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {content.source_language === 'en' ? (
            <div className="flex items-center gap-2">
              <RussianFlagIcon />
              <span className="text-xs uppercase tracking-widest text-[#3d6b6b]/70 font-semibold">
                Your Russian translation
              </span>
            </div>
          ) : (
            <span className="text-xs uppercase tracking-widest text-[#3d6b6b]/70 font-semibold">
              Your English translation
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={answered}
            placeholder="Type your translation..."
            className={`w-full px-5 py-4 rounded-xl border text-[15px] font-mono bg-white text-[#3d6b6b] placeholder:text-[#3d6b6b]/70/40 focus:outline-none transition-all duration-200 ${
              answered
                ? isCorrect
                  ? 'border-[#4CAF50]/50'
                  : 'border-[#EF4444]/50'
                : 'border-gray-200 focus:border-[#e58300] focus:ring-2 focus:ring-[#e58300]/20'
            }`}
          />
          {answered && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isCorrect ? <CheckIcon /> : <XIcon />}
            </div>
          )}
        </div>
      </div>

      {!answered && (
        <Button size="sm" onClick={handleSubmit} disabled={!input.trim()}>
          Check Translation
        </Button>
      )}

      <AnimatePresence>
        {answered && (
          <FeedbackOverlay
            correct={isCorrect}
            correctAnswer={
              !isCorrect ? content.correct_translation : undefined
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ExerciseCard ───────────────────────────────────────

export default function ExerciseCard({ exercise, onAnswer }: ExerciseCardProps) {
  const renderExercise = useCallback(() => {
    switch (exercise.type) {
      case 'vocabulary_quiz': {
        const content = exercise.content as VocabQuizContent;
        return (
          <VocabQuiz
            exercise={exercise}
            content={content}
            onAnswer={onAnswer}
          />
        );
      }
      case 'fill_blank': {
        const content = exercise.content as FillBlankContent;
        return <FillBlank content={content} onAnswer={onAnswer} />;
      }
      case 'sentence_build': {
        const content = exercise.content as SentenceBuildContent;
        return <SentenceBuild content={content} onAnswer={onAnswer} />;
      }
      case 'translation': {
        const content = exercise.content as TranslationContent;
        return <Translation content={content} onAnswer={onAnswer} />;
      }
      default:
        return (
          <p className="text-[#3d6b6b]/70 text-sm">
            Unsupported exercise type: {exercise.type}
          </p>
        );
    }
  }, [exercise, onAnswer]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={`rounded-2xl p-6 sm:p-8 ${CARD_CONTAINER}`}
    >
      {/* Instruction badge */}
      <div className="flex items-center gap-2 mb-5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e58300]" />
        <p className="text-sm text-[#3d6b6b]/70 font-medium">
          {exercise.instruction}
        </p>
      </div>

      {/* Hint */}
      {exercise.hints && exercise.hints.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#e58300]/[0.06] border border-[#e58300]/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e58300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-xs text-[#e58300]/80 font-medium">
            {exercise.hints[0]}
          </p>
        </div>
      )}

      {renderExercise()}
    </motion.div>
  );
}
