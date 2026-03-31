'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LearnerProfile } from '@/types';
import { saveProfile, loadProfile, clearAll } from '@/lib/storage';
import { generateId } from '@/lib/utils';

interface UseProfileReturn {
  profile: LearnerProfile | null;
  updateProfile: (updates: Partial<LearnerProfile>) => void;
  resetProfile: () => void;
  isLoaded: boolean;
}

function createDefaultProfile(): LearnerProfile {
  const now = new Date().toISOString();
  return {
    learner_id: generateId(),
    name: '',
    assessed_level: 'A1',
    skill_breakdown: {
      speaking: 'A1',
      listening: 'A1',
      reading: 'A1',
      writing: 'A1',
      grammar: 'A1',
      vocabulary: 'A1',
    },
    interest_domain: '',
    interest_subdomains: [],
    native_language: 'en',
    session_count: 0,
    vocabulary_learned: [],
    grammar_points_covered: [],
    weak_areas: [],
    strong_areas: [],
    created_at: now,
    updated_at: now,
  };
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored);
    setIsLoaded(true);
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<LearnerProfile>) => {
      setProfile((prev) => {
        const base = prev ?? createDefaultProfile();
        const updated: LearnerProfile = {
          ...base,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        saveProfile(updated);
        return updated;
      });
    },
    []
  );

  const resetProfile = useCallback(() => {
    clearAll();
    setProfile(null);
  }, []);

  return { profile, updateProfile, resetProfile, isLoaded };
}
