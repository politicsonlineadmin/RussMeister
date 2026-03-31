'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type {
  LearnerProfile,
  VocabularyItem,
  SessionRecord,
  GrammarPoint,
  CEFRLevel,
  SkillType,
} from '@/types';
import { CEFR_ORDER } from '@/types';
import { loadVocabulary, loadSessionHistory } from '@/lib/storage';
import { getLevelProgress, getGrammarTopicsForLevel, getWeakestSkill } from '@/lib/curriculum';
import { cefrToNumber, formatDate } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────
interface ProgressScreenProps {
  profile: LearnerProfile;
}

// ─── Grammar storage helper ───────────────────────────────────
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

// ─── Skill labels ─────────────────────────────────────────────
const SKILL_LABELS: Record<SkillType, string> = {
  speaking: 'Speaking',
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
};

const SKILL_ICONS: Record<SkillType, string> = {
  speaking: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  listening: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z',
  reading: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
  writing: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  grammar: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  vocabulary: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
};

// ─── Streak calculator ────────────────────────────────────────
function calculateStreak(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const uniqueDates = new Set<string>();
  sorted.forEach((s) => {
    const d = new Date(s.date);
    uniqueDates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });

  const dateStrings = Array.from(uniqueDates).sort().reverse();
  let streak = 0;
  const today = new Date();
  let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const dateStr of dateStrings) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (dateStr === key) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Allow starting from yesterday if no session today
      if (streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const key2 = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
        if (dateStr === key2) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  return streak;
}

// ─── Radar Chart (simple SVG) - Light theme ──────────────────
function SkillRadarChart({ profile }: { profile: LearnerProfile }) {
  const skills: SkillType[] = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary'];
  const n = skills.length;
  const cx = 120;
  const cy = 120;
  const maxR = 90;

  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i: number, value: number): [number, number] => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (value / 6) * maxR;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  // Background rings
  const rings = [1, 2, 3, 4, 5, 6];

  // Data polygon
  const dataPoints = skills.map((skill, i) => {
    const value = cefrToNumber(profile.skill_breakdown[skill]);
    return getPoint(i, value);
  });
  const dataPath = dataPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + 'Z';

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[300px] mx-auto">
      {/* Defs */}
      <defs>
        <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e58300" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#e58300" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Background rings */}
      {rings.map((ring) => {
        const points = skills.map((_, i) => getPoint(i, ring));
        const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + 'Z';
        return (
          <path key={ring} d={path} fill="none" stroke="#e5e7eb" strokeWidth="1" />
        );
      })}

      {/* Axis lines */}
      {skills.map((_, i) => {
        const [x, y] = getPoint(i, 6);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />
        );
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="url(#radarFill)" stroke="#e58300" strokeWidth="2.5" />

      {/* Data points */}
      {dataPoints.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill="#e58300" opacity="0.2" />
          <circle cx={x} cy={y} r="3.5" fill="#e58300" />
          <circle cx={x} cy={y} r="1.5" fill="white" />
        </g>
      ))}

      {/* Labels */}
      {skills.map((skill, i) => {
        const [x, y] = getPoint(i, 7.5);
        return (
          <text
            key={skill}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[#3d6b6b]/70 text-[9px] font-semibold"
          >
            {SKILL_LABELS[skill]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Custom Recharts Tooltip (light theme) ───────────────────
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-[#3d6b6b]/70 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold text-[#e58300]">
          {entry.name}: {typeof entry.value === 'number' ? Math.round(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── Daily Streak Week View ──────────────────────────────────
function DailyStreakWeek({ sessions }: { sessions: SessionRecord[] }) {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = todayDay === 0 ? 6 : todayDay - 1;

  const sessionDates = new Set<string>();
  sessions.forEach((s) => {
    const d = new Date(s.date);
    sessionDates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });

  return (
    <div className="flex items-center justify-center gap-3">
      {dayLabels.map((label, i) => {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() - mondayOffset + i);
        const key = `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`;
        const isToday = i === mondayOffset;
        const isFuture = i > mondayOffset;
        const completed = sessionDates.has(key);

        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#3d6b6b]/70">{label}</span>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                completed
                  ? 'bg-[#4CAF50] text-white'
                  : isToday
                    ? 'bg-white border-2 border-[#4CAF50] text-[#4CAF50]'
                    : isFuture
                      ? 'bg-gray-100 text-gray-300 border border-gray-200'
                      : 'bg-gray-100 text-[#3d6b6b]/50 border border-gray-200'
              }`}
            >
              {dayDate.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ProgressScreen({ profile }: ProgressScreenProps) {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [grammarPoints, setGrammarPoints] = useState<GrammarPoint[]>([]);

  // Load data
  useEffect(() => {
    setVocabulary(loadVocabulary());
    setSessions(loadSessionHistory());
    setGrammarPoints(loadGrammarPoints());
  }, []);

  // Derived calculations
  const levelProgress = useMemo(
    () => getLevelProgress(profile, vocabulary, grammarPoints),
    [profile, vocabulary, grammarPoints]
  );

  const currentLevelNum = cefrToNumber(profile.assessed_level);
  const nextLevel = currentLevelNum < 6 ? CEFR_ORDER[currentLevelNum] : null;

  const streak = useMemo(() => calculateStreak(sessions), [sessions]);

  const totalMinutes = useMemo(
    () => sessions.reduce((sum, s) => sum + s.duration_minutes, 0),
    [sessions]
  );

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20),
    [sessions]
  );

  const weakestSkill = useMemo(() => getWeakestSkill(profile), [profile]);

  // Vocabulary growth chart data
  const vocabGrowthData = useMemo(() => {
    if (vocabulary.length === 0) return [];

    const sorted = [...vocabulary]
      .filter((v) => v.last_seen)
      .sort((a, b) => new Date(a.last_seen!).getTime() - new Date(b.last_seen!).getTime());

    if (sorted.length === 0) return [];

    const dataMap = new Map<string, number>();
    let count = 0;
    sorted.forEach((v) => {
      const dateKey = new Date(v.last_seen!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      count++;
      dataMap.set(dateKey, count);
    });

    return Array.from(dataMap.entries()).map(([date, count]) => ({ date, count }));
  }, [vocabulary]);

  // Accuracy trend chart data
  const accuracyTrendData = useMemo(() => {
    if (recentSessions.length === 0) return [];
    return [...recentSessions]
      .reverse()
      .map((s) => ({
        date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        accuracy: Math.round(s.accuracy),
      }));
  }, [recentSessions]);

  // Grammar mastery grid
  const grammarMasteryGrid = useMemo(() => {
    const levels = CEFR_ORDER.filter(
      (l) => cefrToNumber(l) <= currentLevelNum
    );
    const gpMap = new Map<string, GrammarPoint>();
    grammarPoints.forEach((gp) => gpMap.set(gp.topic, gp));

    return levels.map((level) => {
      const topics = getGrammarTopicsForLevel(level);
      return {
        level,
        topics: topics.map((topic) => {
          const gp = gpMap.get(topic);
          return {
            name: topic,
            status: gp?.mastered
              ? ('mastered' as const)
              : gp && gp.times_practiced > 0
                ? ('in-progress' as const)
                : ('not-started' as const),
          };
        }),
      };
    });
  }, [grammarPoints, currentLevelNum]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs: string[] = [];

    if (weakestSkill) {
      recs.push(
        `Focus on ${SKILL_LABELS[weakestSkill]} exercises to balance your skills. It is currently at ${profile.skill_breakdown[weakestSkill]}.`
      );
    }

    const masteredVocab = vocabulary.filter((v) => v.leitner_box >= 4).length;
    if (vocabulary.length > 0 && masteredVocab / vocabulary.length < 0.5) {
      recs.push('Review your vocabulary more frequently to increase mastery rate.');
    }

    if (sessions.length > 0) {
      const avgAccuracy = sessions.reduce((s, sess) => s + sess.accuracy, 0) / sessions.length;
      if (avgAccuracy < 70) {
        recs.push('Your average accuracy is below 70%. Consider reviewing previous material before moving on.');
      }
    }

    if (streak === 0) {
      recs.push('Start a daily practice streak! Consistent study builds lasting fluency.');
    } else if (streak >= 7) {
      recs.push(`Great ${streak}-day streak! Keep the momentum going.`);
    }

    const notStartedGrammar = grammarMasteryGrid.flatMap((g) =>
      g.topics.filter((t) => t.status === 'not-started')
    ).length;
    if (notStartedGrammar > 3) {
      recs.push(`You have ${notStartedGrammar} grammar topics not yet practiced at your level or below. Try some grammar-focused sessions.`);
    }

    if (recs.length === 0) {
      recs.push('You are making solid progress! Keep up the regular practice.');
    }

    return recs;
  }, [weakestSkill, profile, vocabulary, sessions, streak, grammarMasteryGrid]);

  // ─── Render helpers ─────────────────────────────────────────
  const skills: SkillType[] = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary'];

  return (
    <div className="min-h-screen bg-[#f8ffff] p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-[#3d6b6b]">
            Progress Report
          </h1>
          <p className="text-[#3d6b6b]/70 text-sm mt-1">
            Comprehensive learning analytics for {profile.name}
          </p>
        </motion.div>

        {/* Hero Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {/* Current Level */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#e58300]/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#e58300]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-3xl font-mono font-bold text-[#e58300]">{profile.assessed_level}</p>
            <p className="text-xs text-[#3d6b6b]/70 mt-1">CEFR Level</p>
          </div>
          {/* Streak */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-orange-500">{streak}</p>
            <p className="text-xs text-[#3d6b6b]/70 mt-1">Day Streak</p>
          </div>
          {/* Total Words */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-[#4CAF50]">{vocabulary.length}</p>
            <p className="text-xs text-[#3d6b6b]/70 mt-1">Words Learned</p>
          </div>
          {/* Study Time */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-purple-500">
              {totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`}
            </p>
            <p className="text-xs text-[#3d6b6b]/70 mt-1">Study Time</p>
          </div>
        </motion.div>

        {/* Daily Streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#3d6b6b] mb-4">Daily Streak</h2>
          <DailyStreakWeek sessions={sessions} />
        </motion.div>

        {/* Level Trajectory */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#3d6b6b] mb-5">Level Trajectory</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-bold text-[#e58300]">{profile.assessed_level}</span>
                {nextLevel && (
                  <span className="text-sm font-mono text-[#3d6b6b]/50">{nextLevel}</span>
                )}
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <motion.div
                  className="h-full bg-[#e58300] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-[#3d6b6b] shrink-0 w-16 text-right">
              {levelProgress}%
            </span>
          </div>
          {/* Level milestone dots */}
          <div className="flex items-center gap-1 mt-4">
            {CEFR_ORDER.map((level) => {
              const num = cefrToNumber(level);
              const reached = num <= currentLevelNum;
              const isCurrent = level === profile.assessed_level;
              return (
                <div key={level} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        isCurrent
                          ? 'bg-[#e58300] border-[#e58300] shadow-md shadow-[#e58300]/30'
                          : reached
                            ? 'bg-[#4CAF50] border-[#4CAF50]'
                            : 'bg-gray-100 border-gray-300'
                      }`}
                    />
                    {isCurrent && (
                      <motion.div
                        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-[#e58300]/30"
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${
                    isCurrent ? 'text-[#e58300]' : reached ? 'text-[#4CAF50]' : 'text-[#3d6b6b]/50'
                  }`}>
                    {level}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Skill Breakdown - Radar + Bars */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Radar Chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#3d6b6b] mb-4">Skill Radar</h2>
            <SkillRadarChart profile={profile} />
          </div>

          {/* Skill Bars */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#3d6b6b] mb-4">Skill Breakdown</h2>
            <div className="space-y-4">
              {skills.map((skill) => {
                const level = profile.skill_breakdown[skill];
                const num = cefrToNumber(level);
                const pct = (num / 6) * 100;

                return (
                  <div key={skill}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#3d6b6b]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={SKILL_ICONS[skill]} />
                          </svg>
                        </div>
                        <span className="text-sm text-[#3d6b6b] font-medium">{SKILL_LABELS[skill]}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#e58300] bg-[#e58300]/10 px-2 py-0.5 rounded-full">{level}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#e58300] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vocabulary Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-[#3d6b6b] mb-4">Vocabulary Growth</h2>
            {vocabGrowthData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={vocabGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: '#3d6b6b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis tick={{ fill: '#3d6b6b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Words"
                    stroke="#4CAF50"
                    strokeWidth={2.5}
                    dot={{ fill: '#4CAF50', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#4CAF50', stroke: '#4CAF50', strokeWidth: 2, strokeOpacity: 0.3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#3d6b6b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#3d6b6b]/70">
                    Complete more sessions to see your vocabulary growth.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Accuracy Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-[#3d6b6b] mb-4">Accuracy Trend</h2>
            {accuracyTrendData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={accuracyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: '#3d6b6b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#3d6b6b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy %"
                    stroke="#e58300"
                    strokeWidth={2.5}
                    dot={{ fill: '#e58300', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#e58300', stroke: '#e58300', strokeWidth: 2, strokeOpacity: 0.3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#3d6b6b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#3d6b6b]/70">
                    Complete more sessions to see your accuracy trend.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Session History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#3d6b6b] mb-4">Session History</h2>
          {recentSessions.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#3d6b6b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-[#3d6b6b]/70">
                No sessions yet. Start your first session to begin tracking progress!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {recentSessions.map((session, idx) => (
                <div
                  key={session.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    idx % 2 === 0 ? 'bg-[#e7f5f5] border-[#e7f5f5]' : 'bg-white border-[#e7f5f5]'
                  } hover:border-gray-200`}
                >
                  {/* Date */}
                  <div className="shrink-0 w-20">
                    <p className="text-xs text-[#3d6b6b]/70 font-medium">{formatDate(session.date)}</p>
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-gray-100 text-[#3d6b6b]/70 rounded-full border border-gray-200">
                        {session.level}
                      </span>
                      {session.domain && (
                        <span className="text-xs text-[#3d6b6b]/70 truncate">
                          {session.domain}
                        </span>
                      )}
                      {session.grammar_topic && (
                        <span className="text-xs text-[#3d6b6b]/70 truncate font-grammar">
                          {session.grammar_topic}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#3d6b6b]/50">
                        {session.duration_minutes}min
                      </span>
                      <span className="text-xs text-[#3d6b6b]/50">
                        {session.exercises_correct}/{session.exercises_completed} exercises
                      </span>
                      {session.skill_focus.length > 0 && (
                        <span className="text-xs text-[#3d6b6b]/50">
                          {session.skill_focus.map((s) => SKILL_LABELS[s]).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Accuracy as mini bar + number */}
                  <div className="shrink-0 flex items-center gap-2.5">
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className={`h-full rounded-full transition-all ${
                          session.accuracy >= 80
                            ? 'bg-[#4CAF50]'
                            : session.accuracy >= 60
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${session.accuracy}%` }}
                      />
                    </div>
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        session.accuracy >= 80
                          ? 'text-[#4CAF50]'
                          : session.accuracy >= 60
                            ? 'text-amber-500'
                            : 'text-red-500'
                      }`}
                    >
                      {Math.round(session.accuracy)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Grammar Mastery Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#3d6b6b] mb-5">Grammar Mastery</h2>
          {grammarMasteryGrid.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[#3d6b6b]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <p className="text-sm text-[#3d6b6b]/70">
                Grammar tracking will appear as you practice grammar topics in sessions.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {grammarMasteryGrid.map(({ level, topics }) => (
                <div key={level}>
                  <p className="text-xs font-mono font-bold text-[#3d6b6b]/70 mb-2.5 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px]">{level}</span>
                    <span className="text-[#3d6b6b]/50">{topics.length} topics</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((topic) => (
                      <div
                        key={topic.name}
                        title={topic.name}
                        className={`
                          w-7 h-7 rounded-lg cursor-default transition-all hover:scale-110
                          ${topic.status === 'mastered'
                            ? 'bg-[#4CAF50]/30 border border-[#4CAF50]/50'
                            : topic.status === 'in-progress'
                              ? 'bg-amber-300/40 border border-amber-400/50'
                              : 'bg-gray-100 border border-gray-200'
                          }
                        `}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex gap-5 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-[#4CAF50]/30 border border-[#4CAF50]/50" />
                  <span className="text-xs text-[#3d6b6b]/70">Mastered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-amber-300/40 border border-amber-400/50" />
                  <span className="text-xs text-[#3d6b6b]/70">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-gray-100 border border-gray-200" />
                  <span className="text-xs text-[#3d6b6b]/70">Not Started</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-[#e58300]/20 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#3d6b6b] mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e58300]/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#e58300]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            Recommendations
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 bg-[#e7f5f5] rounded-xl border border-[#e7f5f5]">
                <div className="w-6 h-6 shrink-0 rounded-full bg-[#e58300]/10 flex items-center justify-center mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#e58300]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <span className="text-sm text-[#3d6b6b]/70 leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
