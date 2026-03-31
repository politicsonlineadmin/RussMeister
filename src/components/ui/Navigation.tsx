'use client';

import { useState } from 'react';
import type { AppScreen } from '@/types';
import LevelBadge from './LevelBadge';
import type { CEFRLevel } from '@/types';

interface NavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  level?: CEFRLevel;
}

const navItems: { screen: AppScreen; label: string; icon: React.ReactNode }[] = [
  {
    screen: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    screen: 'session',
    label: 'Session',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    screen: 'vocabulary',
    label: 'Vocabulary',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    screen: 'grammar',
    label: 'Grammar',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
  {
    screen: 'progress',
    label: 'Progress',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function Navigation({
  currentScreen,
  onNavigate,
  level,
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Level */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-1 cursor-pointer group"
              >
                <span className="text-lg">&#127479;&#127482;</span>
                <span className="text-xl font-bold text-[#e58300] transition-colors duration-200">
                  Russ
                </span>
                <span className="text-xl font-bold text-[#3d6b6b]">
                  Meister
                </span>
              </button>
              {level && (
                <div className="ml-1">
                  <LevelBadge level={level} size="sm" />
                </div>
              )}
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ screen, label }) => {
                const isActive = currentScreen === screen;
                return (
                  <button
                    key={screen}
                    onClick={() => onNavigate(screen)}
                    className={`
                      relative px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 cursor-pointer
                      ${
                        isActive
                          ? 'text-[#e58300]'
                          : 'text-[#3d6b6b]/70 hover:text-[#3d6b6b] hover:bg-[#e7f5f5]'
                      }
                    `}
                  >
                    {label}
                    {isActive && (
                      <div
                        className="absolute -bottom-[1px] left-3 right-3 h-[2px] rounded-full bg-[#e58300]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-[#3d6b6b]/70 hover:text-[#3d6b6b] hover:bg-[#e7f5f5] transition-all duration-200 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {isMobileMenuOpen && (
          <>
            {/* Scrim overlay */}
            <div
              className="fixed inset-0 top-16 bg-black/20 md:hidden z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Dropdown panel */}
            <div
              className="absolute top-16 left-0 right-0 bg-white border-t border-[#e7f5f5] shadow-lg md:hidden z-50"
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map(({ screen, label }) => {
                  const isActive = currentScreen === screen;
                  return (
                    <button
                      key={screen}
                      onClick={() => {
                        onNavigate(screen);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`
                        block w-full text-left px-4 py-3 rounded-lg text-sm font-medium
                        transition-all duration-200 cursor-pointer
                        ${
                          isActive
                            ? 'text-[#e58300] bg-[#e7f5f5]'
                            : 'text-[#3d6b6b]/70 hover:text-[#3d6b6b] hover:bg-[#e7f5f5]'
                        }
                      `}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ screen, label, icon }) => {
            const isActive = currentScreen === screen;
            return (
              <button
                key={screen}
                onClick={() => onNavigate(screen)}
                className={`
                  flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                  transition-colors duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'text-[#e58300]'
                      : 'text-[#3d6b6b]/50'
                  }
                `}
              >
                {icon}
                <span className="text-[10px] font-medium leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
