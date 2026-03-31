'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  CYRILLIC_ALPHABET,
  GROUP_INFO,
  GROUP_ORDER,
  READING_SYLLABLES,
  READING_WORDS,
  getLettersByGroup,
  generateQuizOptions,
  type LetterGroup,
  type CyrillicLetter,
} from '@/data/alphabet';

// ─── Types ──────────────────────────────────────────────────

interface AlphabetScreenProps {
  onComplete: () => void;
}

type Section = 'intro' | 'quiz' | 'reading' | 'mastery';

interface GroupProgress {
  introduced: boolean;
  quizPassed: boolean;
}

// ─── TTS helper (standalone, doesn't need CEFR level) ───────

function speakRussian(text: string, rate = 0.75) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  u.rate = rate;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

// ─── Small Audio Button ─────────────────────────────────────

function SmallAudioButton({ text, size = 'md' }: { text: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 14 : 18;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); speakRussian(text); }}
      className={`${dim} rounded-full bg-[#e58300] hover:bg-[#cc7400] text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm`}
      aria-label={`Play: ${text}`}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </button>
  );
}

// ─── Progress Bar ───────────────────────────────────────────

function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[#3d6b6b]/70">{label}</span>
          <span className="text-xs font-semibold text-[#3d6b6b]">{pct}%</span>
        </div>
      )}
      <div className="w-full bg-[#e7f5f5] rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full bg-[#e58300] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Checkmark Icon ─────────────────────────────────────────

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Lock Icon ──────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─── Letter Card ────────────────────────────────────────────

function LetterCard({ letter, expanded, onClick }: { letter: CyrillicLetter; expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 cursor-pointer text-left w-full ${
        expanded ? 'border-[#e58300] shadow-md' : 'border-[#e7f5f5] hover:border-[#e58300]/40'
      }`}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Large letter display */}
        <div className="w-20 h-20 rounded-xl bg-[#f8ffff] border border-[#e7f5f5] flex flex-col items-center justify-center shrink-0">
          <span className="text-4xl font-bold text-[#3d6b6b] leading-none">{letter.upper}</span>
          <span className="text-xl text-[#3d6b6b]/60 leading-none mt-1">{letter.lower}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#3d6b6b]">{letter.sound}</span>
            {letter.ipa && (
              <span className="text-xs text-[#3d6b6b]/50 font-mono">{letter.ipa}</span>
            )}
          </div>
          {letter.latinLookalike && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-[#e7f5f5] text-[#3d6b6b]/70">
              Looks like &ldquo;{letter.latinLookalike}&rdquo;
            </span>
          )}
        </div>

        <SmallAudioButton text={letter.lower} size="sm" />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#e7f5f5] pt-3">
          <div className="flex items-center gap-3">
            <SmallAudioButton text={letter.exampleWord} />
            <div>
              <p className="text-base font-semibold text-[#3d6b6b]">
                {letter.exampleWord.split('').map((char, i) => (
                  <span
                    key={i}
                    className={i === letter.exampleHighlight ? 'text-[#e58300] underline decoration-2 underline-offset-2' : ''}
                  >
                    {char}
                  </span>
                ))}
              </p>
              <p className="text-sm text-[#3d6b6b]/70">{letter.exampleTranslation}</p>
            </div>
          </div>
          {letter.name && (
            <p className="text-xs text-[#3d6b6b]/50 mt-2">
              Letter name: <span className="font-medium">{letter.name}</span>
            </p>
          )}
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

export default function AlphabetScreen({ onComplete }: AlphabetScreenProps) {
  const [section, setSection] = useState<Section>('intro');
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [groupProgress, setGroupProgress] = useState<Record<LetterGroup, GroupProgress>>(() => {
    const init: Record<string, GroupProgress> = {};
    GROUP_ORDER.forEach((g) => { init[g] = { introduced: false, quizPassed: false }; });
    return init as Record<LetterGroup, GroupProgress>;
  });

  // Letter intro state
  const [expandedLetter, setExpandedLetter] = useState<number | null>(null);

  // Quiz state
  const [quizLetters, setQuizLetters] = useState<CyrillicLetter[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizShowResult, setQuizShowResult] = useState(false);
  const [quizPassed, setQuizPassed] = useState<boolean | null>(null);

  // Reading practice state
  const [readingStep, setReadingStep] = useState<'syllables' | 'words'>('syllables');
  const [readingIdx, setReadingIdx] = useState(0);
  const [readingShowTranslation, setReadingShowTranslation] = useState(false);
  const [readingComplete, setReadingComplete] = useState(false);

  // Mastery test state
  const [masteryQuestions, setMasteryQuestions] = useState<{ type: 'letter' | 'word'; item: CyrillicLetter | { word: string; translation: string }; options: string[] }[]>([]);
  const [masteryIdx, setMasteryIdx] = useState(0);
  const [masterySelected, setMasterySelected] = useState<string | null>(null);
  const [masteryCorrect, setMasteryCorrect] = useState(0);
  const [masteryShowResult, setMasteryShowResult] = useState(false);
  const [masteryPassed, setMasteryPassed] = useState<boolean | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top on section change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [section, currentGroupIdx, quizIdx, masteryIdx]);

  const currentGroup = GROUP_ORDER[currentGroupIdx];
  const currentGroupLetters = useMemo(() => getLettersByGroup(currentGroup), [currentGroup]);

  // Count completed groups
  const completedGroups = GROUP_ORDER.filter((g) => groupProgress[g].quizPassed).length;
  const allGroupsDone = completedGroups === GROUP_ORDER.length;

  // ─── Quiz Logic ─────────────────────────────────────────────

  const startQuiz = useCallback((group: LetterGroup) => {
    const letters = getLettersByGroup(group);
    // Shuffle and repeat to get ~10 questions (or all if group is small)
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    const repeated = [...shuffled, ...shuffled.sort(() => Math.random() - 0.5)].slice(0, Math.max(letters.length, 8));
    setQuizLetters(repeated);
    setQuizIdx(0);
    setQuizCorrect(0);
    setQuizTotal(repeated.length);
    setQuizSelected(null);
    setQuizShowResult(false);
    setQuizPassed(null);
    // Generate first options
    setQuizOptions(generateQuizOptions(repeated[0], CYRILLIC_ALPHABET));
    setSection('quiz');
  }, []);

  const handleQuizAnswer = useCallback((answer: string) => {
    if (quizSelected !== null) return; // already answered
    setQuizSelected(answer);
    const isCorrect = answer === quizLetters[quizIdx].sound;
    if (isCorrect) setQuizCorrect((c) => c + 1);

    setTimeout(() => {
      const nextIdx = quizIdx + 1;
      if (nextIdx >= quizLetters.length) {
        // Quiz done
        const finalCorrect = isCorrect ? quizCorrect + 1 : quizCorrect;
        const passed = finalCorrect / quizTotal >= 0.8;
        setQuizPassed(passed);
        setQuizShowResult(true);
        if (passed) {
          setGroupProgress((prev) => ({
            ...prev,
            [currentGroup]: { ...prev[currentGroup], quizPassed: true },
          }));
        }
      } else {
        setQuizIdx(nextIdx);
        setQuizSelected(null);
        setQuizOptions(generateQuizOptions(quizLetters[nextIdx], CYRILLIC_ALPHABET));
      }
    }, 800);
  }, [quizSelected, quizLetters, quizIdx, quizCorrect, quizTotal, currentGroup]);

  // ─── Start Reading Practice ─────────────────────────────────

  const startReading = useCallback(() => {
    setReadingStep('syllables');
    setReadingIdx(0);
    setReadingShowTranslation(false);
    setReadingComplete(false);
    setSection('reading');
  }, []);

  // ─── Mastery Test Logic ─────────────────────────────────────

  const startMastery = useCallback(() => {
    // 20 random letter questions + 10 word questions
    const shuffledLetters = [...CYRILLIC_ALPHABET].sort(() => Math.random() - 0.5).slice(0, 20);
    const shuffledWords = [...READING_WORDS].sort(() => Math.random() - 0.5).slice(0, 10);

    const letterQs = shuffledLetters.map((letter) => ({
      type: 'letter' as const,
      item: letter,
      options: generateQuizOptions(letter, CYRILLIC_ALPHABET),
    }));

    const wordQs = shuffledWords.map((w) => {
      const otherWords = READING_WORDS.filter((rw) => rw.translation !== w.translation);
      const wrongOptions = otherWords.sort(() => Math.random() - 0.5).slice(0, 3).map((rw) => rw.translation);
      const options = [w.translation, ...wrongOptions].sort(() => Math.random() - 0.5);
      return {
        type: 'word' as const,
        item: w,
        options,
      };
    });

    setMasteryQuestions([...letterQs, ...wordQs]);
    setMasteryIdx(0);
    setMasteryCorrect(0);
    setMasterySelected(null);
    setMasteryShowResult(false);
    setMasteryPassed(null);
    setSection('mastery');
  }, []);

  const handleMasteryAnswer = useCallback((answer: string) => {
    if (masterySelected !== null) return;
    setMasterySelected(answer);

    const q = masteryQuestions[masteryIdx];
    let isCorrect = false;
    if (q.type === 'letter') {
      isCorrect = answer === (q.item as CyrillicLetter).sound;
    } else {
      isCorrect = answer === (q.item as { word: string; translation: string }).translation;
    }
    if (isCorrect) setMasteryCorrect((c) => c + 1);

    setTimeout(() => {
      const nextIdx = masteryIdx + 1;
      if (nextIdx >= masteryQuestions.length) {
        const finalCorrect = isCorrect ? masteryCorrect + 1 : masteryCorrect;
        const passed = finalCorrect / masteryQuestions.length >= 0.8;
        setMasteryPassed(passed);
        setMasteryShowResult(true);
      } else {
        setMasteryIdx(nextIdx);
        setMasterySelected(null);
      }
    }, 800);
  }, [masterySelected, masteryQuestions, masteryIdx, masteryCorrect]);

  // ─── Mark group as introduced ─────────────────────────────

  const markIntroduced = useCallback(() => {
    setGroupProgress((prev) => ({
      ...prev,
      [currentGroup]: { ...prev[currentGroup], introduced: true },
    }));
  }, [currentGroup]);

  // ─── Navigation Helpers ───────────────────────────────────

  const goToNextGroup = useCallback(() => {
    if (currentGroupIdx < GROUP_ORDER.length - 1) {
      setCurrentGroupIdx((i) => i + 1);
      setExpandedLetter(null);
      setSection('intro');
    }
  }, [currentGroupIdx]);

  const goToGroup = useCallback((idx: number) => {
    setCurrentGroupIdx(idx);
    setExpandedLetter(null);
    setSection('intro');
  }, []);

  // ═════════════════════════════════════════════════════════════
  // ─── RENDER ───────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════

  return (
    <div ref={scrollRef} className="min-h-screen bg-[#f8ffff] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-12 pt-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#3d6b6b] tracking-tight">
            Cyrillic Alphabet
          </h1>
          <p className="text-sm text-[#3d6b6b]/70 mt-1">
            Master the Russian alphabet before starting A1
          </p>

          {/* Overall progress */}
          <div className="mt-4">
            <ProgressBar
              value={completedGroups + (readingComplete ? 1 : 0)}
              max={GROUP_ORDER.length + 1}
              label="Overall Progress"
            />
          </div>

          {/* Group pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {GROUP_ORDER.map((g, i) => {
              const info = GROUP_INFO[g];
              const prog = groupProgress[g];
              const isCurrent = i === currentGroupIdx && section === 'intro';
              return (
                <button
                  key={g}
                  onClick={() => goToGroup(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    prog.quizPassed
                      ? 'bg-[#E8F8EE] text-[#27AE60] border border-[#27AE60]/30'
                      : isCurrent
                        ? 'bg-[#e58300] text-white border border-[#e58300]'
                        : 'bg-white text-[#3d6b6b]/70 border border-[#e7f5f5] hover:border-[#e58300]/40'
                  }`}
                >
                  {prog.quizPassed && <CheckIcon size={12} />}
                  {info.title}
                </button>
              );
            })}
            {/* Reading practice pill */}
            <button
              onClick={() => { if (allGroupsDone) startReading(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                readingComplete
                  ? 'bg-[#E8F8EE] text-[#27AE60] border border-[#27AE60]/30'
                  : allGroupsDone
                    ? 'bg-white text-[#3d6b6b]/70 border border-[#e7f5f5] hover:border-[#e58300]/40'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              {readingComplete && <CheckIcon size={12} />}
              {!allGroupsDone && <LockIcon />}
              Reading
            </button>
            {/* Mastery pill */}
            <button
              onClick={() => { if (allGroupsDone && readingComplete) startMastery(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                masteryPassed === true
                  ? 'bg-[#E8F8EE] text-[#27AE60] border border-[#27AE60]/30'
                  : allGroupsDone && readingComplete
                    ? 'bg-white text-[#3d6b6b]/70 border border-[#e7f5f5] hover:border-[#e58300]/40'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              {masteryPassed === true && <CheckIcon size={12} />}
              {!(allGroupsDone && readingComplete) && <LockIcon />}
              Mastery Test
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ─── SECTION: Letter Introduction ───────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {section === 'intro' && (
          <div>
            {/* Group header */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#3d6b6b]">
                    Group {currentGroupIdx + 1}: {GROUP_INFO[currentGroup].title}
                  </h2>
                  <p className="text-sm text-[#e58300] font-medium mt-0.5">
                    {GROUP_INFO[currentGroup].subtitle}
                  </p>
                </div>
                {groupProgress[currentGroup].quizPassed && (
                  <div className="w-8 h-8 rounded-full bg-[#27AE60] flex items-center justify-center text-white">
                    <CheckIcon size={16} />
                  </div>
                )}
              </div>
              <p className="text-sm text-[#3d6b6b]/70 mt-2">
                {GROUP_INFO[currentGroup].description}
              </p>
            </div>

            {/* Letter cards */}
            <div className="space-y-3">
              {currentGroupLetters.map((letter, i) => (
                <LetterCard
                  key={letter.upper}
                  letter={letter}
                  expanded={expandedLetter === i}
                  onClick={() => setExpandedLetter(expandedLetter === i ? null : i)}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              {!groupProgress[currentGroup].quizPassed && (
                <button
                  onClick={() => { markIntroduced(); startQuiz(currentGroup); }}
                  className="w-full py-3.5 rounded-2xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold text-base shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Take the Quiz for This Group
                </button>
              )}
              {groupProgress[currentGroup].quizPassed && currentGroupIdx < GROUP_ORDER.length - 1 && (
                <button
                  onClick={goToNextGroup}
                  className="w-full py-3.5 rounded-2xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold text-base shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  Next Group
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
              {allGroupsDone && !readingComplete && (
                <button
                  onClick={startReading}
                  className="w-full py-3.5 rounded-2xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold text-base shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  Start Reading Practice
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
              {allGroupsDone && readingComplete && masteryPassed !== true && (
                <button
                  onClick={startMastery}
                  className="w-full py-3.5 rounded-2xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold text-base shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  Take Mastery Test
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ─── SECTION: Letter Recognition Quiz ───────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {section === 'quiz' && !quizShowResult && (
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-[#3d6b6b]">
                  Quiz: {GROUP_INFO[currentGroup].title}
                </h2>
                <span className="text-sm font-medium text-[#3d6b6b]/70">
                  {quizIdx + 1} / {quizTotal}
                </span>
              </div>
              <ProgressBar value={quizIdx} max={quizTotal} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-6 mb-4">
              <p className="text-sm text-[#3d6b6b]/70 mb-4 text-center">
                What sound does this letter make?
              </p>

              {/* Big letter display */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 rounded-2xl bg-[#f8ffff] border-2 border-[#e7f5f5] flex flex-col items-center justify-center mb-3">
                  <span className="text-6xl font-bold text-[#3d6b6b] leading-none">
                    {quizLetters[quizIdx]?.upper}
                  </span>
                  <span className="text-3xl text-[#3d6b6b]/50 leading-none mt-1">
                    {quizLetters[quizIdx]?.lower}
                  </span>
                </div>
                <SmallAudioButton text={quizLetters[quizIdx]?.lower || ''} size="sm" />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {quizOptions.map((opt) => {
                  const isCorrect = opt === quizLetters[quizIdx]?.sound;
                  const isSelected = quizSelected === opt;
                  let borderClass = 'border-[#e7f5f5] hover:border-[#e58300]/40';
                  let bgClass = 'bg-white';

                  if (quizSelected !== null) {
                    if (isCorrect) {
                      borderClass = 'border-[#27AE60]';
                      bgClass = 'bg-[#E8F8EE]';
                    } else if (isSelected && !isCorrect) {
                      borderClass = 'border-[#E74C3C]';
                      bgClass = 'bg-[#FDECEB]';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleQuizAnswer(opt)}
                      disabled={quizSelected !== null}
                      className={`w-full py-3 px-4 rounded-xl border-2 text-left font-medium text-[#3d6b6b] transition-all cursor-pointer ${borderClass} ${bgClass} ${quizSelected !== null ? 'cursor-default' : ''}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quiz Result */}
        {section === 'quiz' && quizShowResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-6 text-center">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
              quizPassed ? 'bg-[#E8F8EE] text-[#27AE60]' : 'bg-[#FDECEB] text-[#E74C3C]'
            }`}>
              {quizPassed ? (
                <CheckIcon size={32} />
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>

            <h2 className="text-xl font-bold text-[#3d6b6b] mb-2">
              {quizPassed ? 'Group Passed!' : 'Not Quite Yet'}
            </h2>
            <p className="text-sm text-[#3d6b6b]/70 mb-2">
              You got <span className="font-bold text-[#3d6b6b]">{quizCorrect}</span> out of <span className="font-bold text-[#3d6b6b]">{quizTotal}</span> correct ({Math.round((quizCorrect / quizTotal) * 100)}%)
            </p>
            <p className="text-xs text-[#3d6b6b]/50 mb-6">
              {quizPassed ? 'You need 80% to pass. Great job!' : 'You need 80% to pass. Review the letters and try again!'}
            </p>

            <div className="space-y-3">
              {quizPassed && currentGroupIdx < GROUP_ORDER.length - 1 && (
                <button
                  onClick={goToNextGroup}
                  className="w-full py-3 rounded-xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold transition-colors cursor-pointer"
                >
                  Continue to Next Group
                </button>
              )}
              {quizPassed && allGroupsDone && !readingComplete && (
                <button
                  onClick={startReading}
                  className="w-full py-3 rounded-xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold transition-colors cursor-pointer"
                >
                  Start Reading Practice
                </button>
              )}
              {!quizPassed && (
                <>
                  <button
                    onClick={() => { setSection('intro'); }}
                    className="w-full py-3 rounded-xl bg-white border-2 border-[#e7f5f5] text-[#3d6b6b] font-semibold hover:border-[#e58300]/40 transition-colors cursor-pointer"
                  >
                    Review Letters Again
                  </button>
                  <button
                    onClick={() => startQuiz(currentGroup)}
                    className="w-full py-3 rounded-xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold transition-colors cursor-pointer"
                  >
                    Retry Quiz
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ─── SECTION: Reading Practice ──────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {section === 'reading' && !readingComplete && (
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-[#3d6b6b]">
                  {readingStep === 'syllables' ? 'Syllable Reading' : 'Word Reading'}
                </h2>
                <span className="text-sm font-medium text-[#3d6b6b]/70">
                  {readingIdx + 1} / {readingStep === 'syllables' ? READING_SYLLABLES.length : READING_WORDS.length}
                </span>
              </div>
              <ProgressBar
                value={readingIdx}
                max={readingStep === 'syllables' ? READING_SYLLABLES.length : READING_WORDS.length}
              />
              <p className="text-xs text-[#3d6b6b]/50 mt-2">
                {readingStep === 'syllables'
                  ? 'Try to read each syllable aloud, then tap the audio to check!'
                  : 'Try to read each word aloud and guess the meaning!'}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-8 text-center">
              {readingStep === 'syllables' ? (
                <>
                  <p className="text-7xl font-bold text-[#3d6b6b] mb-6">
                    {READING_SYLLABLES[readingIdx]?.text}
                  </p>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <SmallAudioButton text={READING_SYLLABLES[readingIdx]?.text || ''} />
                    <span className="text-sm text-[#3d6b6b]/50">
                      Sounds like: <span className="font-medium text-[#3d6b6b]">{READING_SYLLABLES[readingIdx]?.sound}</span>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-6xl font-bold text-[#3d6b6b] mb-4">
                    {READING_WORDS[readingIdx]?.word}
                  </p>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <SmallAudioButton text={READING_WORDS[readingIdx]?.word || ''} />
                    {readingShowTranslation ? (
                      <span className="text-base font-medium text-[#e58300]">
                        = {READING_WORDS[readingIdx]?.translation}
                      </span>
                    ) : (
                      <button
                        onClick={() => setReadingShowTranslation(true)}
                        className="text-sm text-[#3d6b6b]/50 underline cursor-pointer hover:text-[#3d6b6b]"
                      >
                        Show meaning
                      </button>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  const maxIdx = readingStep === 'syllables' ? READING_SYLLABLES.length - 1 : READING_WORDS.length - 1;
                  if (readingIdx < maxIdx) {
                    setReadingIdx((i) => i + 1);
                    setReadingShowTranslation(false);
                  } else if (readingStep === 'syllables') {
                    setReadingStep('words');
                    setReadingIdx(0);
                    setReadingShowTranslation(false);
                  } else {
                    setReadingComplete(true);
                  }
                }}
                className="mt-4 px-8 py-3 rounded-xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold transition-colors cursor-pointer"
              >
                {readingStep === 'syllables' && readingIdx < READING_SYLLABLES.length - 1
                  ? 'Next Syllable'
                  : readingStep === 'syllables'
                    ? 'Move to Words'
                    : readingIdx < READING_WORDS.length - 1
                      ? 'Next Word'
                      : 'Complete Reading Practice'}
              </button>
            </div>
          </div>
        )}

        {/* Reading Complete */}
        {section === 'reading' && readingComplete && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-6 text-center">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 bg-[#E8F8EE] text-[#27AE60]">
              <CheckIcon size={32} />
            </div>
            <h2 className="text-xl font-bold text-[#3d6b6b] mb-2">Reading Practice Complete!</h2>
            <p className="text-sm text-[#3d6b6b]/70 mb-6">
              You have practiced reading syllables and words. Time for the final mastery test!
            </p>
            <button
              onClick={startMastery}
              className="w-full py-3.5 rounded-xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              Take Mastery Test
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ─── SECTION: Mastery Test ──────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {section === 'mastery' && !masteryShowResult && masteryQuestions.length > 0 && (
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-[#3d6b6b]">
                  Alphabet Mastery Test
                </h2>
                <span className="text-sm font-medium text-[#3d6b6b]/70">
                  {masteryIdx + 1} / {masteryQuestions.length}
                </span>
              </div>
              <ProgressBar value={masteryIdx} max={masteryQuestions.length} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-6">
              {masteryQuestions[masteryIdx].type === 'letter' ? (
                <>
                  <p className="text-sm text-[#3d6b6b]/70 mb-4 text-center">
                    What sound does this letter make?
                  </p>
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-28 h-28 rounded-2xl bg-[#f8ffff] border-2 border-[#e7f5f5] flex flex-col items-center justify-center mb-3">
                      <span className="text-5xl font-bold text-[#3d6b6b] leading-none">
                        {(masteryQuestions[masteryIdx].item as CyrillicLetter).upper}
                      </span>
                      <span className="text-2xl text-[#3d6b6b]/50 leading-none mt-1">
                        {(masteryQuestions[masteryIdx].item as CyrillicLetter).lower}
                      </span>
                    </div>
                    <SmallAudioButton text={(masteryQuestions[masteryIdx].item as CyrillicLetter).lower} size="sm" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#3d6b6b]/70 mb-4 text-center">
                    What does this word mean?
                  </p>
                  <div className="flex flex-col items-center mb-6">
                    <p className="text-5xl font-bold text-[#3d6b6b] mb-3">
                      {(masteryQuestions[masteryIdx].item as { word: string; translation: string }).word}
                    </p>
                    <SmallAudioButton
                      text={(masteryQuestions[masteryIdx].item as { word: string; translation: string }).word}
                      size="sm"
                    />
                  </div>
                </>
              )}

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {masteryQuestions[masteryIdx].options.map((opt) => {
                  const q = masteryQuestions[masteryIdx];
                  let correctAnswer: string;
                  if (q.type === 'letter') {
                    correctAnswer = (q.item as CyrillicLetter).sound;
                  } else {
                    correctAnswer = (q.item as { word: string; translation: string }).translation;
                  }
                  const isCorrect = opt === correctAnswer;
                  const isSelected = masterySelected === opt;
                  let borderClass = 'border-[#e7f5f5] hover:border-[#e58300]/40';
                  let bgClass = 'bg-white';

                  if (masterySelected !== null) {
                    if (isCorrect) {
                      borderClass = 'border-[#27AE60]';
                      bgClass = 'bg-[#E8F8EE]';
                    } else if (isSelected && !isCorrect) {
                      borderClass = 'border-[#E74C3C]';
                      bgClass = 'bg-[#FDECEB]';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleMasteryAnswer(opt)}
                      disabled={masterySelected !== null}
                      className={`w-full py-3 px-4 rounded-xl border-2 text-left font-medium text-[#3d6b6b] transition-all cursor-pointer ${borderClass} ${bgClass} ${masterySelected !== null ? 'cursor-default' : ''}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mastery Result */}
        {section === 'mastery' && masteryShowResult && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-6 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
              masteryPassed ? 'bg-[#E8F8EE] text-[#27AE60]' : 'bg-[#FDECEB] text-[#E74C3C]'
            }`}>
              {masteryPassed ? (
                <CheckIcon size={40} />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>

            <h2 className="text-2xl font-bold text-[#3d6b6b] mb-2">
              {masteryPassed ? 'Alphabet Mastered!' : 'Almost There!'}
            </h2>
            <p className="text-sm text-[#3d6b6b]/70 mb-2">
              You got <span className="font-bold text-[#3d6b6b]">{masteryCorrect}</span> out of <span className="font-bold text-[#3d6b6b]">{masteryQuestions.length}</span> correct ({Math.round((masteryCorrect / masteryQuestions.length) * 100)}%)
            </p>
            <p className="text-xs text-[#3d6b6b]/50 mb-6">
              {masteryPassed
                ? 'Congratulations! You are ready to start learning Russian at A1 level!'
                : 'You need 80% to pass. Keep practicing and try again!'}
            </p>

            {masteryPassed ? (
              <div>
                {/* A1 unlock badge */}
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#e58300] text-white font-bold text-lg mb-6">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  A1 Unlocked!
                </div>
                <br />
                <button
                  onClick={onComplete}
                  className="w-full py-3.5 rounded-xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold text-lg transition-colors cursor-pointer"
                >
                  Start Learning Russian
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => { setSection('intro'); setCurrentGroupIdx(0); }}
                  className="w-full py-3 rounded-xl bg-white border-2 border-[#e7f5f5] text-[#3d6b6b] font-semibold hover:border-[#e58300]/40 transition-colors cursor-pointer"
                >
                  Review All Groups
                </button>
                <button
                  onClick={startMastery}
                  className="w-full py-3 rounded-xl bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold transition-colors cursor-pointer"
                >
                  Retry Mastery Test
                </button>
              </div>
            )}

            {/* Motivational A1 badge (shown when not yet passed) */}
            {!masteryPassed && (
              <div className="mt-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mb-2">
                  <LockIcon />
                </div>
                <p className="text-xs text-[#3d6b6b]/40 font-medium">A1 Content Locked</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
