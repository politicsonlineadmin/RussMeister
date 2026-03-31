'use client';

import { useState } from 'react';
import type { SpeakingFeedback, WritingFeedback } from '@/types';

interface FeedbackPanelProps {
  type: 'speaking' | 'writing';
  feedback: SpeakingFeedback | WritingFeedback;
}

function isSpeakingFeedback(
  type: string,
  fb: SpeakingFeedback | WritingFeedback
): fb is SpeakingFeedback {
  return type === 'speaking';
}

function ScoreBar({ score, label, maxScore = 10 }: { score: number; label: string; maxScore?: number }) {
  const pct = (score / maxScore) * 100;
  const isGood = pct >= 80;
  const isMedium = pct >= 50 && pct < 80;

  const fillColor = isGood
    ? '#4CAF50'
    : isMedium
      ? '#f59e0b'
      : '#ef4444';

  const textColor = isGood
    ? 'text-green-600'
    : isMedium
      ? 'text-amber-600'
      : 'text-red-500';

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[#3d6b6b]/70">{label}</span>
        <span className={`font-semibold tabular-nums ${textColor}`}>
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  color,
  borderColor,
}: {
  title: string;
  items: string[];
  color: string;
  borderColor: string;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className="mb-4 rounded-lg bg-[#e7f5f5] overflow-hidden"
    >
      <div className="flex">
        <div className="w-1 shrink-0 rounded-l-lg" style={{ backgroundColor: borderColor }} />
        <div className="p-3 flex-1">
          <h4 className="text-sm font-semibold mb-2" style={{ color }}>
            {title}
          </h4>
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li
                key={i}
                className="text-sm text-[#3d6b6b]/70 pl-4 relative"
              >
                <span
                  className="absolute left-0 top-[7px] w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ErrorDetail({
  error,
}: {
  error: { original: string; correction: string; explanation: string; error_type: string };
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg overflow-hidden mb-2 bg-red-50 border border-red-100">
      <div className="flex">
        <div className="w-1 shrink-0 bg-red-400" />
        <div className="flex-1 p-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm line-through text-red-400">
                  {error.original}
                </span>
                <span className="text-[#3d6b6b]/50">&rarr;</span>
                <span className="text-sm text-green-600 font-medium">
                  {error.correction}
                </span>
              </div>
              <span
                className={`text-[#3d6b6b]/50 ml-2 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
            <span className="text-xs text-red-500 mt-1 inline-block font-grammar px-1.5 py-0.5 rounded bg-red-100">
              {error.error_type}
            </span>
          </button>
          {isExpanded && (
            <p className="text-sm text-[#3d6b6b]/70 mt-2.5 pt-2.5 border-t border-red-100">
              {error.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPanel({ type, feedback }: FeedbackPanelProps) {
  if (isSpeakingFeedback(type, feedback)) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <h3 className="text-lg font-semibold mb-5 text-[#3d6b6b] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#e58300]" />
          Speaking Feedback
        </h3>

        <ScoreBar score={feedback.overall_score} label="Overall Score" />

        <div className="mt-5 space-y-3">
          <Section
            title="What you did well"
            items={[feedback.what_they_did_well]}
            color="#4CAF50"
            borderColor="#4CAF50"
          />
          <Section
            title="What to improve"
            items={[feedback.what_to_improve]}
            color="#f59e0b"
            borderColor="#f59e0b"
          />
          <div className="space-y-2.5 text-sm text-[#3d6b6b]/70 bg-[#e7f5f5] rounded-lg p-3">
            <p>
              <span className="font-medium text-[#3d6b6b]">Pronunciation:</span>{' '}
              {feedback.pronunciation_feedback}
            </p>
            <p>
              <span className="font-medium text-[#3d6b6b]">Grammar:</span>{' '}
              {feedback.grammar_feedback}
            </p>
            <p>
              <span className="font-medium text-[#3d6b6b]">Vocabulary:</span>{' '}
              {feedback.vocabulary_feedback}
            </p>
          </div>
        </div>

        {feedback.corrected_version && (
          <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-100 font-grammar text-sm">
            <span className="text-xs text-[#3d6b6b]/70 block mb-1.5 uppercase tracking-wider font-sans font-semibold">
              Corrected version
            </span>
            <span className="text-green-700">
              {feedback.corrected_version}
            </span>
          </div>
        )}

        {feedback.encouragement && (
          <p className="mt-5 text-sm text-[#e58300] italic pl-3 border-l-2 border-[#e58300]/30">
            {feedback.encouragement}
          </p>
        )}
      </div>
    );
  }

  // Writing feedback
  const writingFb = feedback as WritingFeedback;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-[#3d6b6b] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#e58300]" />
          Writing Feedback
        </h3>
        <span className="text-sm font-medium text-[#3d6b6b]/70">
          CEFR Estimate:{' '}
          <span className="text-[#e58300] font-bold">
            {writingFb.overall_cefr_estimate}
          </span>
        </span>
      </div>

      <div className="space-y-1 mb-5">
        <ScoreBar
          score={writingFb.grammatical_accuracy_score}
          label="Grammar"
        />
        <ScoreBar score={writingFb.vocabulary_score} label="Vocabulary" />
        <ScoreBar score={writingFb.coherence_score} label="Coherence" />
      </div>

      <Section
        title="Strengths"
        items={writingFb.strengths}
        color="#4CAF50"
        borderColor="#4CAF50"
      />
      <Section
        title="Areas for Improvement"
        items={writingFb.improvements}
        color="#f59e0b"
        borderColor="#f59e0b"
      />

      {writingFb.errors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2.5 text-red-500 flex items-center gap-2">
            Errors
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 tabular-nums">
              {writingFb.errors.length}
            </span>
          </h4>
          {writingFb.errors.map((error, i) => (
            <ErrorDetail key={i} error={error} />
          ))}
        </div>
      )}

      {writingFb.model_answer && (
        <div className="mt-5 p-4 rounded-xl bg-[#e7f5f5] font-grammar text-sm">
          <span className="text-xs text-[#3d6b6b]/70 block mb-1.5 uppercase tracking-wider font-sans font-semibold">
            Model answer
          </span>
          <span className="text-[#3d6b6b]">
            {writingFb.model_answer}
          </span>
        </div>
      )}

      {writingFb.encouragement && (
        <p className="mt-5 text-sm text-[#e58300] italic pl-3 border-l-2 border-[#e58300]/30">
          {writingFb.encouragement}
        </p>
      )}
    </div>
  );
}
