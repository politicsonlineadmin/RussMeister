'use client';

import { useState, useEffect } from 'react';
import { AppScreen, LearnerProfile } from '@/types';
import Navigation from '@/components/ui/Navigation';
import OnboardingScreen from '@/components/onboarding/OnboardingScreen';
import AssessmentScreen from '@/components/onboarding/AssessmentScreen';
import DashboardScreen from '@/components/dashboard/DashboardScreen';
import SessionScreen from '@/components/session/SessionScreen';
import VocabularyScreen from '@/components/vocabulary/VocabularyScreen';
import GrammarScreen from '@/components/grammar/GrammarScreen';
import ProgressScreen from '@/components/progress/ProgressScreen';

const STORAGE_KEY = 'russmeister_profile';

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('onboarding');
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LearnerProfile;
        setProfile(parsed);
        setScreen('dashboard');
      } catch {
        // Corrupted data — start fresh
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  const handleProfileCreated = (newProfile: LearnerProfile) => {
    setProfile(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    setScreen('assessment');
  };

  const handleAssessmentComplete = (updatedProfile: LearnerProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
    setScreen('dashboard');
  };

  const handleProfileUpdate = (updatedProfile: LearnerProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
  };

  const handleNavigate = (target: AppScreen) => {
    setScreen(target);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8ffff] flex items-center justify-center">
        <div className="animate-pulse text-[#e58300] text-2xl font-bold tracking-wide">
          RussMeister
        </div>
      </div>
    );
  }

  const showNav = profile && screen !== 'onboarding' && screen !== 'assessment';

  return (
    <div className="min-h-screen bg-[#f8ffff] text-[#3d6b6b]">
      {showNav && (
        <Navigation currentScreen={screen} onNavigate={handleNavigate} level={profile?.assessed_level} />
      )}
      <main className={showNav ? 'pt-16' : ''}>
        {screen === 'onboarding' && (
          <OnboardingScreen onComplete={handleProfileCreated} />
        )}
        {screen === 'assessment' && profile && (
          <AssessmentScreen
            profile={profile}
            onComplete={handleAssessmentComplete}
          />
        )}
        {screen === 'dashboard' && profile && (
          <DashboardScreen
            profile={profile}
            onNavigate={handleNavigate}
          />
        )}
        {screen === 'session' && profile && (
          <SessionScreen
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
            onNavigate={handleNavigate}
          />
        )}
        {screen === 'vocabulary' && profile && (
          <VocabularyScreen profile={profile} />
        )}
        {screen === 'grammar' && profile && (
          <GrammarScreen profile={profile} />
        )}
        {screen === 'progress' && profile && (
          <ProgressScreen profile={profile} />
        )}
      </main>
    </div>
  );
}
