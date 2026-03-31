'use client';

import { useState, useMemo, useCallback } from 'react';
import type { LearnerProfile, CEFRLevel, SkillBreakdown } from '@/types';
import { INTEREST_DOMAINS } from '@/data/interest-domains';
import { generateId } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────
interface OnboardingScreenProps {
  onComplete: (profile: LearnerProfile) => void;
}

type ExperienceOption = {
  label: string;
  sublabel: string;
  level: CEFRLevel;
  icon: string;
};

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  { label: 'None', sublabel: "I'm a complete beginner", level: 'A1', icon: '\u{1F331}' },
  { label: 'A little', sublabel: 'I know some basics', level: 'A2', icon: '\u{1F33F}' },
  { label: 'Intermediate', sublabel: 'I can hold simple conversations', level: 'B1', icon: '\u{1F333}' },
  { label: 'Advanced', sublabel: "I'm fairly comfortable", level: 'B2', icon: '\u{26F0}\u{FE0F}' },
];

const TOTAL_STEPS = 5;

// ─── Step Indicator Dots ──────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mt-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'bg-[#e58300] w-8 h-2'
              : i < current
              ? 'bg-[#e58300]/50 w-2 h-2'
              : 'bg-gray-300 w-2 h-2'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [experience, setExperience] = useState<ExperienceOption | null>(null);
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [subdomains, setSubdomains] = useState<string[]>([]);
  const [domainSearch, setDomainSearch] = useState('');

  const goForward = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  // Filter domains by search text
  const filteredDomains = useMemo(() => {
    if (!domainSearch.trim()) return INTEREST_DOMAINS;
    const q = domainSearch.toLowerCase();
    return INTEREST_DOMAINS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.subdomains.some((s) => s.toLowerCase().includes(q))
    );
  }, [domainSearch]);

  // Get subdomains for the selected primary domain
  const availableSubdomains = useMemo(() => {
    if (!primaryDomain) return [];
    const domain = INTEREST_DOMAINS.find((d) => d.id === primaryDomain);
    return domain?.subdomains ?? [];
  }, [primaryDomain]);

  const selectedDomainName = useMemo(() => {
    return INTEREST_DOMAINS.find((d) => d.id === primaryDomain)?.name ?? '';
  }, [primaryDomain]);

  const toggleSubdomain = (sub: string) => {
    setSubdomains((prev) => {
      if (prev.includes(sub)) return prev.filter((s) => s !== sub);
      if (prev.length >= 2) return prev;
      return [...prev, sub];
    });
  };

  const handleComplete = () => {
    if (!experience || !primaryDomain) return;

    const level = experience.level;
    const skillBreakdown: SkillBreakdown = {
      speaking: level,
      listening: level,
      reading: level,
      writing: level,
      grammar: level,
      vocabulary: level,
    };

    const now = new Date().toISOString();
    const profile: LearnerProfile = {
      learner_id: generateId(),
      name: name.trim(),
      assessed_level: level,
      skill_breakdown: skillBreakdown,
      interest_domain: selectedDomainName,
      interest_subdomains: subdomains,
      native_language: 'en',
      session_count: 0,
      vocabulary_learned: [],
      grammar_points_covered: [],
      weak_areas: [],
      strong_areas: [],
      alphabet_mastered: false,
      created_at: now,
      updated_at: now,
    };

    onComplete(profile);
  };

  // ─── Step Renderers ───────────────────────────────────────────

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center text-center px-6 animate-fadeIn">
      <div className="mb-6 rounded-2xl overflow-hidden shadow-lg w-full max-w-sm">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Moscow_Kremlin_from_Bolshoy_Kamenny_bridge_%28crop%29.jpg/640px-Moscow_Kremlin_from_Bolshoy_Kamenny_bridge_%28crop%29.jpg"
          alt="Moscow Kremlin, Russia"
          className="w-full h-48 object-cover"
        />
      </div>

      <h1 className="text-4xl font-bold text-[#3d6b6b] tracking-tight">
        RussMeister <span className="inline-block align-middle text-3xl">{'\u{1F1F7}\u{1F1FA}'}</span>
      </h1>

      <p className="text-[#3d6b6b]/60 text-lg mt-3 max-w-sm">
        Master Russian from A1 to C2
      </p>

      <p className="text-[#3d6b6b]/50 text-sm mt-2 max-w-xs">
        Personalized lessons powered by AI, adapted to your interests and pace.
      </p>

      <button
        onClick={goForward}
        className="mt-10 px-10 py-3.5 bg-[#e58300] text-white font-semibold rounded-full hover:bg-[#cc7400] transition-all duration-200 text-lg shadow-lg shadow-[#e58300]/25 active:scale-[0.97]"
      >
        Get Started
      </button>
    </div>
  );

  const renderName = () => (
    <div className="flex flex-col items-center text-center px-6 w-full max-w-md mx-auto animate-fadeIn">
      <h2 className="text-3xl font-bold text-[#3d6b6b] mb-2">
        What&apos;s your name?
      </h2>
      <p className="text-[#3d6b6b]/60 mb-8">
        We&apos;ll use this to personalize your experience.
      </p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim().length >= 1) goForward();
        }}
        placeholder="Enter your name..."
        autoFocus
        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-[#3d6b6b] text-lg placeholder:text-[#3d6b6b]/50 focus:outline-none focus:border-[#e58300] focus:ring-2 focus:ring-[#e58300]/20 transition-all duration-200 shadow-sm"
      />

      <div className="flex gap-3 mt-8 w-full">
        <button
          onClick={goBack}
          className="flex-1 px-6 py-3 border border-gray-200 text-[#3d6b6b]/60 rounded-full hover:border-gray-300 hover:text-[#3d6b6b]/80 transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={goForward}
          disabled={name.trim().length < 1}
          className="flex-1 px-6 py-3 bg-[#e58300] text-white font-semibold rounded-full hover:bg-[#cc7400] transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="flex flex-col items-center text-center px-6 w-full max-w-md mx-auto animate-fadeIn">
      <h2 className="text-3xl font-bold text-[#3d6b6b] mb-2">
        How much Russian do you know?
      </h2>
      <p className="text-[#3d6b6b]/60 mb-8">
        This helps us find the right starting point.
      </p>

      <div className="w-full space-y-3">
        {EXPERIENCE_OPTIONS.map((opt) => {
          const isSelected = experience?.level === opt.level;
          return (
            <button
              key={opt.level}
              onClick={() => setExperience(opt)}
              className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 bg-white shadow-sm ${
                isSelected
                  ? 'border-[#e58300] ring-2 ring-[#e58300]/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <span className="text-[#3d6b6b] font-medium text-lg">{opt.label}</span>
                    <p className="text-[#3d6b6b]/60 text-sm mt-0.5">{opt.sublabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      isSelected
                        ? 'bg-[#e58300] text-white'
                        : 'bg-gray-100 text-[#3d6b6b]/60'
                    }`}
                  >
                    {opt.level}
                  </span>
                  {isSelected && (
                    <svg className="w-5 h-5 text-[#e58300]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-8 w-full">
        <button
          onClick={goBack}
          className="flex-1 px-6 py-3 border border-gray-200 text-[#3d6b6b]/60 rounded-full hover:border-gray-300 hover:text-[#3d6b6b]/80 transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={goForward}
          disabled={!experience}
          className="flex-1 px-6 py-3 bg-[#e58300] text-white font-semibold rounded-full hover:bg-[#cc7400] transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderInterestDomain = () => (
    <div className="flex flex-col items-center text-center px-6 w-full max-w-lg mx-auto animate-fadeIn">
      <h2 className="text-3xl font-bold text-[#3d6b6b] mb-2">
        What are you passionate about?
      </h2>
      <p className="text-[#3d6b6b]/60 mb-6">
        We&apos;ll tailor your lessons around topics you love.
      </p>

      {/* Search */}
      <div className="w-full mb-5 relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3d6b6b]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={domainSearch}
          onChange={(e) => setDomainSearch(e.target.value)}
          placeholder="Search topics..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-[#3d6b6b] placeholder:text-[#3d6b6b]/50 focus:outline-none focus:border-[#e58300] focus:ring-2 focus:ring-[#e58300]/20 transition-all duration-200 text-sm shadow-sm"
        />
      </div>

      {/* Primary Domain Grid */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredDomains.map((domain) => {
          const isSelected = primaryDomain === domain.id;
          return (
            <button
              key={domain.id}
              onClick={() => {
                if (primaryDomain === domain.id) {
                  setPrimaryDomain(null);
                  setSubdomains([]);
                } else {
                  setPrimaryDomain(domain.id);
                  setSubdomains([]);
                }
              }}
              className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 bg-white shadow-sm ${
                isSelected
                  ? 'border-[#e58300] ring-2 ring-[#e58300]/20'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Image area */}
              {domain.image ? (
                <div className="w-full h-24 overflow-hidden bg-gray-100">
                  <img
                    src={domain.image}
                    alt={domain.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-full h-24 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <span className="text-4xl">{domain.icon}</span>
                </div>
              )}

              {/* Label area */}
              <div className="flex items-center gap-1.5 px-3 py-2.5">
                <span className="text-base">{domain.icon}</span>
                <span className="text-sm font-medium text-[#3d6b6b] leading-tight truncate">{domain.name}</span>
              </div>

              {/* Selected checkmark overlay */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-[#e58300] rounded-full flex items-center justify-center shadow">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
        {filteredDomains.length === 0 && (
          <div className="col-span-full text-[#3d6b6b]/50 py-8">
            No topics match your search. Try different keywords.
          </div>
        )}
      </div>

      {/* Subdomain Selection */}
      {primaryDomain && availableSubdomains.length > 0 && (
        <div className="w-full mt-5 animate-fadeIn">
          <p className="text-[#3d6b6b]/60 text-sm mb-3">
            Choose up to 2 sub-topics <span className="text-[#3d6b6b]/50">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {availableSubdomains.map((sub) => (
              <button
                key={sub}
                onClick={() => toggleSubdomain(sub)}
                className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                  subdomains.includes(sub)
                    ? 'bg-[#e58300]/10 border-[#e58300]/50 text-[#e58300] font-medium'
                    : 'bg-white border-gray-200 text-[#3d6b6b]/60 hover:border-gray-300 hover:text-[#3d6b6b]'
                } ${
                  subdomains.length >= 2 && !subdomains.includes(sub)
                    ? 'opacity-40 cursor-not-allowed'
                    : ''
                }`}
                disabled={subdomains.length >= 2 && !subdomains.includes(sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-8 w-full">
        <button
          onClick={goBack}
          className="flex-1 px-6 py-3 border border-gray-200 text-[#3d6b6b]/60 rounded-full hover:border-gray-300 hover:text-[#3d6b6b]/80 transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={goForward}
          disabled={!primaryDomain}
          className="flex-1 px-6 py-3 bg-[#e58300] text-white font-semibold rounded-full hover:bg-[#cc7400] transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderSummary = () => {
    const domainObj = INTEREST_DOMAINS.find((d) => d.id === primaryDomain);
    return (
      <div className="flex flex-col items-center text-center px-6 w-full max-w-md mx-auto animate-fadeIn">
        <h2 className="text-3xl font-bold text-[#3d6b6b] mb-2">
          Ready to go, {name.trim().split(' ')[0]}!
        </h2>
        <p className="text-[#3d6b6b]/60 mb-8">
          Here&apos;s your learning profile. Next, a quick assessment to fine-tune your level.
        </p>

        <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 space-y-5 text-left shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#3d6b6b]/60 text-sm">Name</span>
            <span className="text-[#3d6b6b] font-medium">{name.trim()}</span>
          </div>
          <div className="h-px bg-gray-100" />

          <div className="flex items-center justify-between">
            <span className="text-[#3d6b6b]/60 text-sm">Starting Level</span>
            <span className="px-3 py-1 bg-[#e58300]/10 text-[#e58300] font-bold text-sm rounded-lg">
              {experience?.level}
            </span>
          </div>
          <div className="h-px bg-gray-100" />

          <div className="flex items-center justify-between">
            <span className="text-[#3d6b6b]/60 text-sm">Interest</span>
            <span className="text-[#3d6b6b] font-medium">
              {domainObj?.icon} {domainObj?.name}
            </span>
          </div>

          {subdomains.length > 0 && (
            <>
              <div className="h-px bg-gray-100" />
              <div className="flex items-start justify-between">
                <span className="text-[#3d6b6b]/60 text-sm">Sub-topics</span>
                <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                  {subdomains.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 text-xs bg-gray-100 text-[#3d6b6b]/60 rounded-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-8 w-full">
          <button
            onClick={goBack}
            className="flex-1 px-6 py-3 border border-gray-200 text-[#3d6b6b]/60 rounded-full hover:border-gray-300 hover:text-[#3d6b6b]/80 transition-colors duration-200"
          >
            Back
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 px-6 py-3 bg-[#e58300] text-white font-semibold rounded-full hover:bg-[#cc7400] transition-colors duration-200 shadow-lg shadow-[#e58300]/25 active:scale-[0.97]"
          >
            Begin Assessment
          </button>
        </div>
      </div>
    );
  };

  // ─── Step Map ─────────────────────────────────────────────────
  const steps = [renderWelcome, renderName, renderExperience, renderInterestDomain, renderSummary];

  return (
    <div className="min-h-screen bg-[#f8ffff] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl min-h-[500px] flex flex-col items-center justify-center py-12">
        <div
          key={step}
          className="w-full transition-opacity duration-300"
        >
          {steps[step]()}
        </div>
      </div>

      {/* Step Dots */}
      <div className="relative z-10 pb-8">
        <StepDots current={step} total={TOTAL_STEPS} />
      </div>

      {/* Global fadeIn animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
