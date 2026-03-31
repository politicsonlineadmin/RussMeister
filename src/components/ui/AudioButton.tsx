'use client';

import type { CEFRLevel } from '@/types';
import { useTTS } from '@/hooks/useSpeech';

interface AudioButtonProps {
  text: string;
  level: CEFRLevel;
}

export default function AudioButton({ text, level }: AudioButtonProps) {
  const { speak, isSpeaking } = useTTS();

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Pulsing ring when speaking — pure CSS */}
      {isSpeaking && (
        <span
          className="absolute inset-0 rounded-full border-2 border-[#e58300] animate-pulse-ring"
        />
      )}

      <button
        type="button"
        onClick={() => speak(text, level)}
        className={`
          relative inline-flex items-center justify-center
          w-11 h-11 rounded-full cursor-pointer
          text-white font-bold
          transition-all duration-200
          ${
            isSpeaking
              ? 'bg-[#e58300] shadow-[0_0_0_4px_rgba(229,131,0,0.25)]'
              : 'bg-[#e58300] hover:bg-[#cc7400] shadow-[0_2px_8px_rgba(229,131,0,0.3)]'
          }
        `}
        aria-label={`Play pronunciation: ${text}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          {isSpeaking && (
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          )}
        </svg>
      </button>
    </div>
  );
}
