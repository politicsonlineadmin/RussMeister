'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  LearnerProfile,
  AppScreen,
  VocabularyItem,
  SessionRecord,
  SkillType,
} from '@/types';
import Button from '@/components/ui/Button';
import LevelBadge from '@/components/ui/LevelBadge';
import { loadVocabulary, loadSessionHistory } from '@/lib/storage';
import { getDueItems } from '@/lib/srs';
import { getVocabularyTargetForLevel, getLevelProgress } from '@/lib/curriculum';
import { formatDate, cefrToNumber } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────

interface DashboardScreenProps {
  profile: LearnerProfile;
  onNavigate: (screen: AppScreen) => void;
}

// ─── Streak Calculator ───────────────────────────────────────

function calculateStreak(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const sessionDate = new Date(sorted[i].date);
    sessionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (sessionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0 && sessionDate.getTime() === today.getTime() - 86400000) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Get streak day statuses ─────────────────────────────────

function getWeekStreakDays(sessions: SessionRecord[]): ('done' | 'today' | 'future')[] {
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0=Sun, 1=Mon, ...
  // Convert to Mon=0 ... Sun=6
  const mondayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

  const sessionDates = new Set(
    sessions.map((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - mondayIndex);

  return Array.from({ length: 7 }, (_, i) => {
    if (i < mondayIndex) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return sessionDates.has(d.getTime()) ? 'done' : 'future';
    }
    if (i === mondayIndex) return 'today';
    return 'future';
  }) as ('done' | 'today' | 'future')[];
}

// ─── Skill card configs ──────────────────────────────────────

const SKILL_CARDS: {
  key: SkillType;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'vocabulary',
    label: 'Vocabulary',
    color: '#e58300',
    bgColor: '#e7f5f5',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e58300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    key: 'grammar',
    label: 'Grammar',
    color: '#9B59B6',
    bgColor: '#F3ECF8',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: 'listening',
    label: 'Listening',
    color: '#E67E22',
    bgColor: '#FDF0E2',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
  {
    key: 'reading',
    label: 'Reading',
    color: '#27AE60',
    bgColor: '#E8F8EE',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    key: 'writing',
    label: 'Writing',
    color: '#E74C3C',
    bgColor: '#FDECEB',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    key: 'speaking',
    label: 'Speaking',
    color: '#2C3E50',
    bgColor: '#ECF0F4',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
];

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─── Main Component ──────────────────────────────────────────

export default function DashboardScreen({
  profile,
  onNavigate,
}: DashboardScreenProps) {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setVocabulary(loadVocabulary());
    setSessions(loadSessionHistory());
  }, []);

  const dueItems = useMemo(() => getDueItems(vocabulary), [vocabulary]);
  const vocabTarget = getVocabularyTargetForLevel(profile.assessed_level);
  const learnedVocabCount = vocabulary.filter((v) => v.times_seen > 0).length;
  const levelProgress = getLevelProgress(profile, vocabulary, []);
  const streak = useMemo(() => calculateStreak(sessions), [sessions]);
  const recentSessions = sessions.slice(0, 5);
  const grammarMastered = profile.grammar_points_covered.length;
  const weekDays = useMemo(() => getWeekStreakDays(sessions), [sessions]);

  // Skill progress (simulated from cefrToNumber, max 6 levels mapped to 8 units)
  const getSkillProgress = (skill: SkillType): { done: number; total: number } => {
    const level = cefrToNumber(profile.skill_breakdown[skill]);
    const done = Math.min(level, 8);
    return { done, total: 8 };
  };

  // Stagger animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <div className="min-h-screen bg-[#f8ffff]">
      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 pt-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* ── Welcome Header Card ─────────────────────────────── */}
        <motion.div variants={item} className="mb-5">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-6 relative overflow-hidden">
            {/* Russian flag emoji */}
            <span className="absolute top-4 right-5 text-3xl" aria-label="Russian flag">
              🇷🇺
            </span>

            <p className="text-sm text-[#3d6b6b]/70 font-medium">Welcome back,</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3d6b6b] mt-0.5 tracking-tight">
              {profile.name || 'Learner'}!
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <LevelBadge level={profile.assessed_level} size="md" />
              {profile.interest_domain && (
                <span className="text-xs px-3 py-1 rounded-full bg-[#f0f1f3] text-[#3d6b6b]/70 font-medium">
                  {profile.interest_domain}
                </span>
              )}
              {/* Cyrillic Alphabet mastery badge */}
              {profile.alphabet_mastered && (
                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-[#E8F8EE] text-[#27AE60] font-medium">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Cyrillic
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Daily Streak Section ────────────────────────────── */}
        <motion.div variants={item} className="mb-5">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#3d6b6b]">Daily Streak</h2>
              {streak > 0 && (
                <span className="text-sm font-bold text-[#4CAF50]">
                  {streak} day{streak !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between px-2">
              {DAY_LABELS.map((day, i) => {
                const status = weekDays[i];
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#3d6b6b]/70">{day}</span>
                    {status === 'done' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 400 }}
                        className="w-9 h-9 rounded-full bg-[#4CAF50] flex items-center justify-center"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.div>
                    ) : status === 'today' ? (
                      <motion.div
                        animate={{
                          boxShadow: [
                            '0 0 0 0px rgba(76,175,80,0.3)',
                            '0 0 0 6px rgba(76,175,80,0)',
                          ],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-9 h-9 rounded-full border-2 border-[#4CAF50] bg-white flex items-center justify-center"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]" />
                      </motion.div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#e8eaed]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Progress Unit Cards (Horizontal Scroll) ─────────── */}
        <motion.div variants={item} className="mb-5">
          <h2 className="text-sm font-semibold text-[#3d6b6b] mb-3 px-1">Skill Progress</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {SKILL_CARDS.map((skill, i) => {
              const progress = getSkillProgress(skill.key);
              const isComplete = progress.done >= progress.total;
              const percentage = Math.round((progress.done / progress.total) * 100);

              return (
                <motion.div
                  key={skill.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] min-w-[150px] w-[150px] shrink-0 overflow-hidden relative"
                >
                  {/* Colored top section */}
                  <div
                    className="h-20 flex items-center justify-center relative"
                    style={{ backgroundColor: skill.bgColor }}
                  >
                    {skill.icon}
                    {/* Completed badge */}
                    {isComplete && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#4CAF50] flex items-center justify-center shadow-sm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-semibold text-[#3d6b6b]">{skill.label}</p>
                    <p className="text-xs text-[#3d6b6b]/70 mt-0.5">{progress.done}/{progress.total}</p>
                    {/* Thin progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#e8eaed] mt-2 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: skill.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.06 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Start Session Button ────────────────────────────── */}
        <motion.div variants={item} className="mb-5">
          <motion.button
            onClick={() => onNavigate('session')}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-full bg-[#e58300] hover:bg-[#cc7400] text-white font-semibold text-lg py-4 rounded-2xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2.5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Session
          </motion.button>
        </motion.div>

        {/* ── Quick Action Cards Row ──────────────────────────── */}
        <motion.div variants={item} className="mb-5">
          <div className="grid grid-cols-3 gap-3">
            {/* Review Vocab */}
            <motion.button
              onClick={() => onNavigate('vocabulary')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white rounded-xl shadow-sm border border-[#e7f5f5] p-4 flex flex-col items-center gap-2 cursor-pointer transition-shadow hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[#e7f5f5] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e58300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-[#3d6b6b]">Review Vocab</span>
            </motion.button>

            {/* Grammar Guide */}
            <motion.button
              onClick={() => onNavigate('grammar')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white rounded-xl shadow-sm border border-[#e7f5f5] p-4 flex flex-col items-center gap-2 cursor-pointer transition-shadow hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F3ECF8] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-[#3d6b6b]">Grammar Guide</span>
            </motion.button>

            {/* Progress */}
            <motion.button
              onClick={() => onNavigate('progress')}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white rounded-xl shadow-sm border border-[#e7f5f5] p-4 flex flex-col items-center gap-2 cursor-pointer transition-shadow hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-[#3d6b6b]">Progress</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── Vocabulary Due Card ─────────────────────────────── */}
        <motion.div variants={item} className="mb-5">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    dueItems.length > 0
                      ? 'bg-[#e7f5f5]'
                      : 'bg-[#E8F8EE]'
                  }`}>
                    {dueItems.length > 0 ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e58300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                  </div>
                  {/* Count badge */}
                  {dueItems.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, delay: 0.4 }}
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#e58300] text-white text-[10px] font-bold px-1 shadow-sm"
                    >
                      {dueItems.length}
                    </motion.span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#3d6b6b]">
                    {dueItems.length > 0 ? 'Vocabulary Due' : 'All Caught Up!'}
                  </h3>
                  <p className="text-xs text-[#3d6b6b]/70 mt-0.5">
                    {dueItems.length > 0
                      ? `${dueItems.length} word${dueItems.length !== 1 ? 's' : ''} to review`
                      : 'No reviews pending right now'}
                  </p>
                </div>
              </div>
              {dueItems.length > 0 && (
                <motion.button
                  onClick={() => onNavigate('session')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 bg-[#e58300] hover:bg-[#cc7400] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Review Now
                </motion.button>
              )}
            </div>

            {/* Due word chips */}
            <AnimatePresence>
              {dueItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 flex flex-wrap gap-1.5"
                >
                  {dueItems.slice(0, 10).map((v, i) => (
                    <motion.span
                      key={v.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.04 }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#e7f5f5] text-[#e58300] font-medium border border-[#c8dede]"
                    >
                      {v.word}
                    </motion.span>
                  ))}
                  {dueItems.length > 10 && (
                    <span className="text-xs text-[#3d6b6b]/70 px-2 py-1 font-medium">
                      +{dueItems.length - 10} more
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Stats Summary Row ────────────────────────────────── */}
        <motion.div variants={item} className="mb-5">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#3d6b6b] tabular-nums">{learnedVocabCount}</p>
                <p className="text-[11px] text-[#3d6b6b]/70 font-medium mt-0.5">Words Learned</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#3d6b6b] tabular-nums">{streak}</p>
                <p className="text-[11px] text-[#3d6b6b]/70 font-medium mt-0.5">Day Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#3d6b6b] tabular-nums">{grammarMastered}</p>
                <p className="text-[11px] text-[#3d6b6b]/70 font-medium mt-0.5">Grammar Pts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#3d6b6b] tabular-nums">{profile.session_count}</p>
                <p className="text-[11px] text-[#3d6b6b]/70 font-medium mt-0.5">Sessions</p>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="mt-5 pt-4 border-t border-[#e7f5f5]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#3d6b6b]/70 font-medium">
                  Level Progress — {profile.assessed_level}
                </span>
                <span className="text-xs font-bold text-[#e58300] tabular-nums">
                  {Math.round(levelProgress)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#e8eaed] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#e58300]"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#3d6b6b]/50 tabular-nums">
                <span>{learnedVocabCount}/{vocabTarget} vocab</span>
                <span>{grammarMastered} grammar points</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Recent Sessions ─────────────────────────────────── */}
        <motion.div variants={item} className="mb-5">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#3d6b6b]">Recent Sessions</h2>
              {recentSessions.length > 0 && (
                <span className="text-xs text-[#3d6b6b]/50 font-medium">
                  Last {recentSessions.length}
                </span>
              )}
            </div>

            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-[#f8ffff] flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3d6b6b" opacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <p className="text-[#3d6b6b]/70 text-sm mb-1 font-medium">No sessions yet</p>
                <p className="text-[#3d6b6b]/50 text-xs mb-4">
                  Start your first session to begin tracking
                </p>
                <motion.button
                  onClick={() => onNavigate('session')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 bg-[#e58300] text-white text-sm font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Begin Learning
                </motion.button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session, i) => {
                  const accuracyColor =
                    session.accuracy >= 80
                      ? '#4CAF50'
                      : session.accuracy >= 50
                        ? '#E67E22'
                        : '#E74C3C';

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#f9fafb] hover:bg-[#f0f2f5] transition-colors"
                    >
                      {/* Date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#3d6b6b] font-medium">
                            {formatDate(session.date)}
                          </span>
                          {session.grammar_topic && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3ECF8] text-[#9B59B6] font-medium truncate max-w-[140px]">
                              {session.grammar_topic}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#3d6b6b]/50">
                          <span>{session.exercises_completed} exercises</span>
                          <span className="w-1 h-1 rounded-full bg-[#d1d5db]" />
                          <span>{session.duration_minutes} min</span>
                        </div>
                      </div>

                      {/* Score */}
                      <span
                        className="text-sm font-bold tabular-nums shrink-0"
                        style={{ color: accuracyColor }}
                      >
                        {session.accuracy}%
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Weak Areas (if any) ─────────────────────────────── */}
        {profile.weak_areas.length > 0 && (
          <motion.div variants={item} className="mb-5">
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7f5f5] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#E74C3C]" />
                <h2 className="text-sm font-semibold text-[#3d6b6b]">Needs Attention</h2>
              </div>
              <div className="space-y-2">
                {profile.weak_areas.map((skill, i) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#FFF5F5] border border-[#FECACA]"
                  >
                    <span className="text-sm text-[#3d6b6b] capitalize font-medium">
                      {skill}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#E74C3C] font-bold">
                      {profile.skill_breakdown[skill]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Footer ──────────────────────────────────────────── */}
        <motion.div variants={item} className="mt-8 text-center">
          <p className="text-[11px] text-[#3d6b6b]/50 font-medium">
            {profile.session_count} sessions completed since{' '}
            {formatDate(profile.created_at)}
          </p>
        </motion.div>
      </motion.div>

      {/* ── Scrollbar hide utility ────────────────────────────── */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
