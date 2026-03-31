'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  LearnerProfile,
  VocabularyItem,
  CEFRLevel,
  PartOfSpeech,
  Gender,
} from '@/types';
import { CEFR_ORDER } from '@/types';
import { loadVocabulary, saveVocabulary } from '@/lib/storage';
import { getDueItems, calculateNextReview } from '@/lib/srs';
import { useTTS } from '@/hooks/useSpeech';
import { formatDate } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────
interface VocabularyScreenProps {
  profile: LearnerProfile;
}

// ─── SRS Status type ──────────────────────────────────────────
type SRSFilter = 'all' | 'due' | 'learning' | 'mastered';

// ─── Gender article color map (light theme) ───────────────────
const GENDER_COLORS: Record<Gender, string> = {
  masculine: 'text-[#e58300]',
  feminine: 'text-pink-500',
  neuter: 'text-[#4CAF50]',
  none: 'text-[#3d6b6b]/70',
};

const GENDER_BORDER_COLORS: Record<Gender, string> = {
  masculine: 'border-l-[#e58300]',
  feminine: 'border-l-pink-500',
  neuter: 'border-l-[#4CAF50]',
  none: 'border-l-[#d1d5db]',
};

const GENDER_ARTICLES: Record<Gender, string> = {
  masculine: 'der',
  feminine: 'die',
  neuter: 'das',
  none: '',
};

const SRS_LABELS: Record<number, string> = {
  0: 'New',
  1: 'Learning',
  2: 'Reviewing',
  3: 'Familiar',
  4: 'Mastered',
};

const SRS_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-[#3d6b6b]/60 border border-gray-200',
  1: 'bg-[#e7f5f5] text-[#e58300] border border-[#e58300]200',
  2: 'bg-[#e7f5f5] text-[#e58300] border border-[#e58300]200',
  3: 'bg-green-50 text-[#4CAF50] border border-green-200',
  4: 'bg-green-100 text-[#4CAF50] border border-green-300',
};

// ─── Main Component ───────────────────────────────────────────
export default function VocabularyScreen({ profile }: VocabularyScreenProps) {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [posFilter, setPosFilter] = useState<PartOfSpeech | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<CEFRLevel | 'all'>('all');
  const [srsFilter, setSrsFilter] = useState<SRSFilter>('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const { speak, isSpeaking } = useTTS();

  // Load vocabulary from localStorage
  useEffect(() => {
    setVocabulary(loadVocabulary());
  }, []);

  // Derived data
  const domains = useMemo(() => {
    const set = new Set(vocabulary.map((v) => v.domain));
    return Array.from(set).sort();
  }, [vocabulary]);

  const partsOfSpeech = useMemo(() => {
    const set = new Set(vocabulary.map((v) => v.part_of_speech));
    return Array.from(set).sort();
  }, [vocabulary]);

  const dueItems = useMemo(() => getDueItems(vocabulary), [vocabulary]);
  const masteredCount = useMemo(
    () => vocabulary.filter((v) => v.leitner_box >= 4).length,
    [vocabulary]
  );

  // Filtered and sorted vocabulary
  const filteredVocabulary = useMemo(() => {
    let items = [...vocabulary];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (v) =>
          v.word.toLowerCase().includes(q) ||
          v.translation.toLowerCase().includes(q)
      );
    }

    // Domain filter
    if (domainFilter !== 'all') {
      items = items.filter((v) => v.domain === domainFilter);
    }

    // Part of speech filter
    if (posFilter !== 'all') {
      items = items.filter((v) => v.part_of_speech === posFilter);
    }

    // Level filter
    if (levelFilter !== 'all') {
      items = items.filter((v) => v.level === levelFilter);
    }

    // SRS filter
    if (srsFilter === 'due') {
      const dueIds = new Set(dueItems.map((d) => d.id));
      items = items.filter((v) => dueIds.has(v.id));
    } else if (srsFilter === 'mastered') {
      items = items.filter((v) => v.leitner_box >= 4);
    } else if (srsFilter === 'learning') {
      items = items.filter((v) => v.leitner_box > 0 && v.leitner_box < 4);
    }

    // Sort: due first, then by next_review
    items.sort((a, b) => {
      const aDue = a.next_review === null || new Date(a.next_review) <= new Date();
      const bDue = b.next_review === null || new Date(b.next_review) <= new Date();
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      const aDate = a.next_review ? new Date(a.next_review).getTime() : 0;
      const bDate = b.next_review ? new Date(b.next_review).getTime() : 0;
      return aDate - bDate;
    });

    return items;
  }, [vocabulary, search, domainFilter, posFilter, levelFilter, srsFilter, dueItems]);

  // Review flashcard items
  const reviewItems = useMemo(() => getDueItems(vocabulary, 20), [vocabulary]);

  const handleReviewAnswer = useCallback(
    (correct: boolean) => {
      if (!reviewItems[reviewIndex]) return;
      const updated = calculateNextReview(reviewItems[reviewIndex], correct);
      const newVocab = vocabulary.map((v) =>
        v.id === updated.id ? updated : v
      );
      setVocabulary(newVocab);
      saveVocabulary(newVocab);

      if (reviewIndex < reviewItems.length - 1) {
        setReviewIndex((i) => i + 1);
        setShowAnswer(false);
        setIsFlipped(false);
      } else {
        setReviewModalOpen(false);
        setReviewIndex(0);
        setShowAnswer(false);
        setIsFlipped(false);
      }
    },
    [vocabulary, reviewItems, reviewIndex]
  );

  const startReview = useCallback(() => {
    setReviewIndex(0);
    setShowAnswer(false);
    setIsFlipped(false);
    setReviewModalOpen(true);
  }, []);

  const handleReveal = useCallback(() => {
    setIsFlipped(true);
    setTimeout(() => setShowAnswer(true), 300);
  }, []);

  // ─── Empty State ────────────────────────────────────────────
  if (vocabulary.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8ffff] p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center max-w-md"
        >
          {/* Light illustration icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-32 h-32 mx-auto mb-8 relative"
          >
            <div className="absolute inset-0 bg-[#e58300]/10 rounded-3xl blur-xl" />
            <div className="relative w-full h-full rounded-3xl bg-white border border-gray-200 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-[#e58300]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              {/* Floating accent dots */}
              <motion.div
                animate={{ y: [-4, 4, -4], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#e58300]/20 flex items-center justify-center"
              >
                <div className="w-2 h-2 rounded-full bg-[#e58300]" />
              </motion.div>
              <motion.div
                animate={{ y: [3, -3, 3], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-[#4CAF50]/20 flex items-center justify-center"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]/60" />
              </motion.div>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-4 text-[#3d6b6b]"
          >
            Vocabulary Vault
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[#3d6b6b]/70 text-lg mb-2"
          >
            Start a session to build your vocabulary!
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[#3d6b6b]/50 text-sm mb-8"
          >
            Words you learn in sessions will appear here for review.
          </motion.p>

          {/* Blue CTA button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl font-bold text-white bg-[#e58300] shadow-lg shadow-[#e58300]/25 transition-shadow hover:shadow-xl hover:shadow-[#e58300]/30 hover:bg-[#cc7400]"
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Begin Your First Session
            </span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8ffff] p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#3d6b6b]">
              Vocabulary Vault
            </h1>
            <p className="text-[#3d6b6b]/70 text-sm mt-1">
              Your personal dictionary and SRS review hub
            </p>
          </div>
          {dueItems.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startReview}
              className="px-6 py-3 bg-[#e58300] text-white font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-[#e58300]/20 hover:bg-[#cc7400]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Quick Review ({dueItems.length} due)
            </motion.button>
          )}
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#e58300]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-[#3d6b6b]">{vocabulary.length}</p>
            <p className="text-xs text-[#3d6b6b]/70 mt-1">Total Words</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-[#4CAF50]">{masteredCount}</p>
            <p className="text-xs text-[#3d6b6b]/70 mt-1">Mastered</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#e58300]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-[#e58300]">{dueItems.length}</p>
            <p className="text-xs text-[#3d6b6b]/70 mt-1">Due for Review</p>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3d6b6b]/50 group-focus-within:text-[#e58300] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search Russian words or English translations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-full text-[#3d6b6b] placeholder-[#3d6b6b]/40 focus:outline-none focus:border-[#e58300] focus:shadow-[0_0_0_3px_rgba(229,131,0,0.1)] transition-all"
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-3"
        >
          {/* Domain filter */}
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-[#3d6b6b]/70 focus:outline-none focus:border-[#e58300] transition-all cursor-pointer"
          >
            <option value="all">All Domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Part of speech filter */}
          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value as PartOfSpeech | 'all')}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-[#3d6b6b]/70 focus:outline-none focus:border-[#e58300] transition-all cursor-pointer"
          >
            <option value="all">All Parts of Speech</option>
            {partsOfSpeech.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>

          {/* Level filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as CEFRLevel | 'all')}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-[#3d6b6b]/70 focus:outline-none focus:border-[#e58300] transition-all cursor-pointer"
          >
            <option value="all">All Levels</option>
            {CEFR_ORDER.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* SRS status filter - pill chips */}
          <div className="flex gap-1.5 bg-gray-100 border border-gray-200 rounded-full p-1">
            {(['all', 'due', 'learning', 'mastered'] as SRSFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setSrsFilter(s)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  srsFilter === s
                    ? 'bg-[#e58300] text-white shadow-sm'
                    : 'text-[#3d6b6b]/70 hover:text-[#3d6b6b] hover:bg-white'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Word List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredVocabulary.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#3d6b6b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-[#3d6b6b]/70 text-sm">No words match your filters.</p>
              </motion.div>
            ) : (
              filteredVocabulary.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  layout
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className={`bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all border-l-[3px] ${GENDER_BORDER_COLORS[item.gender]}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Image thumbnail if available */}
                    {'image' in item && item.image && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <img src={item.image as string} alt={item.word} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Word info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Gender-colored article + word */}
                        <span className="text-xl font-bold text-[#3d6b6b]">
                          {item.gender !== 'none' && (
                            <span className={GENDER_COLORS[item.gender]}>
                              {GENDER_ARTICLES[item.gender]}{' '}
                            </span>
                          )}
                          {item.word}
                        </span>
                        {/* Level badge */}
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-gray-100 text-[#3d6b6b]/70 rounded-full border border-gray-200">
                          {item.level}
                        </span>
                        {/* POS badge */}
                        <span className="px-2.5 py-0.5 text-[10px] text-[#3d6b6b]/50 bg-[#e7f5f5] rounded-full">
                          {item.part_of_speech}
                        </span>
                      </div>
                      {/* Translation */}
                      <p className="text-[#3d6b6b]/70 text-sm mt-1.5">{item.translation}</p>
                      {/* Example sentence */}
                      {item.example_sentence && (
                        <p className="text-[#3d6b6b]/50 text-xs mt-2 italic leading-relaxed">
                          &ldquo;{item.example_sentence}&rdquo;
                        </p>
                      )}
                      {/* IPA */}
                      {item.ipa && (
                        <p className="text-[#3d6b6b]/50 text-xs mt-1 font-mono">/{item.ipa}/</p>
                      )}
                    </div>

                    {/* Right side: SRS + Audio + Last reviewed */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0">
                      {/* SRS box badge */}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${SRS_COLORS[item.leitner_box]}`}>
                        {SRS_LABELS[item.leitner_box]}
                      </span>

                      {/* Audio button */}
                      <button
                        onClick={() => speak(item.word, profile.assessed_level)}
                        disabled={isSpeaking}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#e58300]/10 hover:bg-[#e58300]/20 text-[#e58300] transition-all disabled:opacity-40"
                        aria-label={`Listen to ${item.word}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>

                      {/* Last reviewed */}
                      {item.last_seen && (
                        <span className="text-[10px] text-[#3d6b6b]/50">
                          {formatDate(item.last_seen)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Review Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {reviewModalOpen && reviewItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => setReviewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-2xl"
            >
              {/* Progress bar */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#3d6b6b]/70 font-medium">
                  {reviewIndex + 1} / {reviewItems.length}
                </span>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-[#3d6b6b]/70 hover:text-[#3d6b6b] transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress indicator */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-8 overflow-hidden">
                <motion.div
                  className="h-full bg-[#e58300] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((reviewIndex + 1) / reviewItems.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Flashcard with flip animation */}
              {reviewItems[reviewIndex] && (
                <div className="text-center space-y-6" style={{ perspective: '1000px' }}>
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative min-h-[160px]"
                  >
                    {/* Front of card */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <p className="text-4xl font-bold text-[#3d6b6b] mb-2">
                        {reviewItems[reviewIndex].gender !== 'none' && (
                          <span className={GENDER_COLORS[reviewItems[reviewIndex].gender]}>
                            {GENDER_ARTICLES[reviewItems[reviewIndex].gender]}{' '}
                          </span>
                        )}
                        {reviewItems[reviewIndex].word}
                      </p>
                      <button
                        onClick={() => speak(reviewItems[reviewIndex].word, profile.assessed_level)}
                        disabled={isSpeaking}
                        className="mt-3 w-10 h-10 flex items-center justify-center rounded-full bg-[#e58300]/10 hover:bg-[#e58300]/20 transition-all text-[#e58300]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    </div>

                    {/* Back of card */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="py-4 px-6 bg-[#e7f5f5] rounded-2xl border border-gray-200 w-full">
                        <p className="text-2xl text-[#e58300] font-bold">
                          {reviewItems[reviewIndex].translation}
                        </p>
                        {reviewItems[reviewIndex].example_sentence && (
                          <p className="text-sm text-[#3d6b6b]/70 mt-3 italic">
                            &ldquo;{reviewItems[reviewIndex].example_sentence}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Answer area */}
                  <AnimatePresence mode="wait">
                    {!showAnswer ? (
                      <motion.button
                        key="reveal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleReveal}
                        className="w-full py-4 bg-[#e58300] rounded-2xl text-white font-bold text-lg hover:bg-[#cc7400] transition-all shadow-lg shadow-[#e58300]/20"
                      >
                        Show Answer
                      </motion.button>
                    ) : (
                      <motion.div
                        key="answer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-3"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReviewAnswer(false)}
                          className="flex-1 py-4 bg-red-500 rounded-2xl text-white font-bold hover:bg-red-600 transition-all shadow-md"
                        >
                          Incorrect
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReviewAnswer(true)}
                          className="flex-1 py-4 bg-[#4CAF50] rounded-2xl text-white font-bold hover:bg-[#43a047] transition-all shadow-md"
                        >
                          Correct
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
