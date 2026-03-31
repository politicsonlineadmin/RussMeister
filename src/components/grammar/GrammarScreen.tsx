'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  LearnerProfile,
  GrammarPoint,
  CEFRLevel,
} from '@/types';
import { CEFR_ORDER } from '@/types';
import { getGrammarTopicsForLevel } from '@/lib/curriculum';
import { cefrToNumber } from '@/lib/utils';
import { useTTS } from '@/hooks/useSpeech';

// ─── Props ────────────────────────────────────────────────────
interface GrammarScreenProps {
  profile: LearnerProfile;
}

// ─── Storage helper for grammar points ────────────────────────
function loadGrammarPoints(): GrammarPoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('russmeister_grammar');
    if (!raw) return [];
    return JSON.parse(raw) as GrammarPoint[];
  } catch {
    return [];
  }
}

// ─── Highlight grammar element within sentence ────────────────
function HighlightedSentence({ sentence, highlight }: { sentence: string; highlight: string }) {
  if (!highlight || !sentence.includes(highlight)) {
    return <span>{sentence}</span>;
  }

  const parts = sentence.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'));

  return (
    <span>
      {parts.map((part, i) =>
        part === highlight ? (
          <span key={i} className="text-[#e58300] font-semibold bg-[#e58300]/10 px-1 py-0.5 rounded-md">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// ─── Level tier styles (light theme) ─────────────────────────
const LEVEL_TIER_STYLES: Record<CEFRLevel, { active: string; inactive: string }> = {
  A1: {
    active: 'bg-[#3d6b6b] text-white shadow-md shadow-[#3d6b6b]/20',
    inactive: 'bg-white text-[#3d6b6b] border border-gray-200 hover:border-[#3d6b6b]/40',
  },
  A2: {
    active: 'bg-[#3d6b6b] text-white shadow-md shadow-[#3d6b6b]/20',
    inactive: 'bg-white text-[#3d6b6b] border border-gray-200 hover:border-[#3d6b6b]/40',
  },
  B1: {
    active: 'bg-[#e58300] text-white shadow-md shadow-[#e58300]/20',
    inactive: 'bg-white text-[#e58300] border border-gray-200 hover:border-[#e58300]/40',
  },
  B2: {
    active: 'bg-[#e58300] text-white shadow-md shadow-[#e58300]/20',
    inactive: 'bg-white text-[#e58300] border border-gray-200 hover:border-[#e58300]/40',
  },
  C1: {
    active: 'bg-purple-500 text-white shadow-md shadow-purple-500/20',
    inactive: 'bg-white text-purple-500 border border-gray-200 hover:border-purple-500/40',
  },
  C2: {
    active: 'bg-purple-500 text-white shadow-md shadow-purple-500/20',
    inactive: 'bg-white text-purple-500 border border-gray-200 hover:border-purple-500/40',
  },
};

// ─── Mastery border colors (light theme) ─────────────────────
const MASTERY_BORDER: Record<string, string> = {
  mastered: 'border-l-[#4CAF50]',
  'in-progress': 'border-l-[#e58300]',
  'not-started': 'border-l-gray-300',
};

// ─── Main Component ───────────────────────────────────────────
export default function GrammarScreen({ profile }: GrammarScreenProps) {
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(profile.assessed_level);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [grammarPoints, setGrammarPoints] = useState<GrammarPoint[]>([]);
  const [search, setSearch] = useState('');
  const { speak, isSpeaking } = useTTS();

  const currentLevelNum = cefrToNumber(profile.assessed_level);

  // Load grammar data
  useEffect(() => {
    setGrammarPoints(loadGrammarPoints());
  }, []);

  // Grammar topics for selected level
  const topics = useMemo(
    () => getGrammarTopicsForLevel(selectedLevel),
    [selectedLevel]
  );

  // Map topic names to grammar point data (if any)
  const topicDataMap = useMemo(() => {
    const map = new Map<string, GrammarPoint>();
    grammarPoints.forEach((gp) => {
      map.set(gp.topic, gp);
    });
    return map;
  }, [grammarPoints]);

  const isLevelLocked = useCallback(
    (level: CEFRLevel) => cefrToNumber(level) > currentLevelNum,
    [currentLevelNum]
  );

  const isSelectedLocked = isLevelLocked(selectedLevel);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    if (!search.trim()) return topics;
    const q = search.toLowerCase().trim();
    return topics.filter((t) => t.toLowerCase().includes(q));
  }, [topics, search]);

  const toggleTopic = useCallback((topic: string) => {
    setExpandedTopic((prev) => (prev === topic ? null : topic));
  }, []);

  return (
    <div className="min-h-screen bg-[#f8ffff] p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-[#3d6b6b]">
            Grammar Guide
          </h1>
          <p className="text-[#3d6b6b]/70 text-sm mt-1">
            Reference panel for Russian grammar topics by CEFR level
          </p>
        </motion.div>

        {/* Level Tabs - Pill buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-2.5"
        >
          {CEFR_ORDER.map((level) => {
            const locked = isLevelLocked(level);
            const isActive = selectedLevel === level;
            const isCurrent = level === profile.assessed_level;
            const tierStyle = LEVEL_TIER_STYLES[level];

            return (
              <motion.button
                key={level}
                onClick={() => setSelectedLevel(level)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`
                  relative px-5 py-2.5 rounded-full font-mono font-bold text-sm transition-all
                  ${locked && !isActive
                    ? 'bg-gray-100 text-[#3d6b6b]/50 border border-gray-200 opacity-60'
                    : isActive
                      ? tierStyle.active
                      : tierStyle.inactive
                  }
                `}
              >
                {/* Lock icon overlay for locked levels */}
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/60">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#3d6b6b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
                <span className={locked ? 'opacity-40' : ''}>{level}</span>
                {/* "Your Level" badge */}
                {isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[9px] font-bold bg-[#e58300] text-white rounded-full whitespace-nowrap shadow-md">
                    Your Level
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Search */}
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
            placeholder="Search grammar topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-full text-[#3d6b6b] placeholder-[#3d6b6b]/40 focus:outline-none focus:border-[#e58300] focus:shadow-[0_0_0_3px_rgba(229,131,0,0.1)] transition-all"
          />
        </motion.div>

        {/* Level info banner for locked levels */}
        {isSelectedLocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#3d6b6b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#3d6b6b] font-semibold">Coming Soon</p>
              <p className="text-xs text-[#3d6b6b]/70 mt-0.5">
                These topics unlock when you reach {selectedLevel}. You are currently at {profile.assessed_level}.
              </p>
            </div>
          </motion.div>
        )}

        {/* Topic List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTopics.length === 0 ? (
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
                <p className="text-[#3d6b6b]/70 text-sm">No grammar topics match your search.</p>
              </motion.div>
            ) : (
              filteredTopics.map((topic, i) => {
                const data = topicDataMap.get(topic);
                const isExpanded = expandedTopic === topic;
                const mastered = data?.mastered ?? false;
                const practiced = data ? data.times_practiced > 0 : false;
                const accuracy = data?.accuracy ?? 0;
                const masteryStatus = mastered ? 'mastered' : practiced ? 'in-progress' : 'not-started';

                return (
                  <motion.div
                    key={topic}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    layout
                    className={`
                      rounded-2xl overflow-hidden transition-all border-l-[3px]
                      ${MASTERY_BORDER[masteryStatus]}
                      ${isSelectedLocked
                        ? 'bg-[#e7f5f5] border border-gray-200 opacity-50'
                        : `bg-white border border-gray-200 hover:shadow-md ${isExpanded ? 'shadow-lg' : 'shadow-sm'}`
                      }
                    `}
                  >
                    {/* Topic header */}
                    <button
                      onClick={() => !isSelectedLocked && toggleTopic(topic)}
                      disabled={isSelectedLocked}
                      className="w-full p-4 flex items-start gap-3 text-left group"
                    >
                      {/* Status indicator */}
                      <div className="mt-0.5 shrink-0">
                        {isSelectedLocked ? (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#3d6b6b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        ) : mastered ? (
                          <div className="w-6 h-6 rounded-full bg-[#4CAF50]/10 border border-[#4CAF50]/30 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : practiced ? (
                          <div className="w-6 h-6 rounded-full bg-[#e58300]/10 border border-[#e58300]/30">
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-[#e58300]" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200" />
                        )}
                      </div>

                      {/* Topic content */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-grammar text-sm font-semibold ${isSelectedLocked ? 'text-[#3d6b6b]/50' : 'text-[#3d6b6b] group-hover:text-[#e58300]'} transition-colors`}>
                          {topic}
                        </p>
                        {practiced && !isSelectedLocked && (
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-[#3d6b6b]/70">
                              Practiced {data?.times_practiced ?? 0}x
                            </span>
                            <span className="text-xs text-[#3d6b6b]/70">
                              Accuracy: {accuracy}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expand chevron */}
                      {!isSelectedLocked && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#3d6b6b]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      )}
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && !isSelectedLocked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-5 pt-1 border-t border-[#e7f5f5] space-y-4">
                            {/* Explanation */}
                            {data?.explanation ? (
                              <div className="font-grammar text-sm text-[#3d6b6b]/70 leading-relaxed whitespace-pre-wrap bg-[#e7f5f5] rounded-xl p-4 border border-[#e7f5f5]">
                                {data.explanation}
                              </div>
                            ) : (
                              <div className="bg-[#e7f5f5] rounded-xl p-4 border border-[#e7f5f5]">
                                <p className="text-sm text-[#3d6b6b]/50 italic">
                                  Practice this topic in a session to unlock its detailed explanation.
                                </p>
                              </div>
                            )}

                            {/* Domain-specific examples */}
                            {data?.domain_examples && data.domain_examples.length > 0 && (
                              <div className="space-y-2.5">
                                <p className="text-xs font-bold text-[#3d6b6b]/70 uppercase tracking-wider flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                  </svg>
                                  Examples
                                </p>
                                {data.domain_examples.map((example, j) => (
                                  <div
                                    key={j}
                                    className="bg-[#e7f5f5] rounded-xl p-4 border border-[#e7f5f5] hover:border-gray-200 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <p className="font-mono text-sm text-[#3d6b6b] flex-1 leading-relaxed">
                                        <HighlightedSentence
                                          sentence={example.russian}
                                          highlight={example.highlight}
                                        />
                                      </p>
                                      <button
                                        onClick={() => speak(example.russian, profile.assessed_level)}
                                        disabled={isSpeaking}
                                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#e58300]/10 hover:bg-[#e58300]/20 text-[#e58300] transition-all disabled:opacity-40"
                                        aria-label="Listen to example"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                      </button>
                                    </div>
                                    <p className="text-xs text-[#3d6b6b]/50 mt-2 pl-0.5">
                                      {example.english}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* No examples yet */}
                            {(!data?.domain_examples || data.domain_examples.length === 0) && data?.explanation && (
                              <p className="text-xs text-[#3d6b6b]/50 italic">
                                Complete a session focusing on this topic to see domain-specific examples.
                              </p>
                            )}

                            {/* Mastery progress bar */}
                            {data && (
                              <div className="flex items-center gap-3 pt-2">
                                <div className={`h-2 flex-1 rounded-full overflow-hidden ${
                                  mastered ? 'bg-[#4CAF50]/10' : practiced ? 'bg-[#e58300]/10' : 'bg-gray-100'
                                }`}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${accuracy}%` }}
                                    transition={{ duration: 0.6 }}
                                    className={`h-full rounded-full ${
                                      mastered ? 'bg-[#4CAF50]' : 'bg-[#e58300]'
                                    }`}
                                  />
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  mastered ? 'text-[#4CAF50] bg-[#4CAF50]/10' : practiced ? 'text-[#e58300] bg-[#e58300]/10' : 'text-[#3d6b6b]/50 bg-gray-100'
                                }`}>
                                  {mastered ? 'Mastered' : practiced ? 'In Progress' : 'Not Started'}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-5 pt-5 border-t border-gray-200"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#4CAF50]/10 border border-[#4CAF50]/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs text-[#3d6b6b]/70">Mastered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#e58300]/10 border border-[#e58300]/30">
              <div className="w-full h-full rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e58300]" />
              </div>
            </div>
            <span className="text-xs text-[#3d6b6b]/70">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-200" />
            <span className="text-xs text-[#3d6b6b]/70">Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#3d6b6b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-[#3d6b6b]/70">Locked (above your level)</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
