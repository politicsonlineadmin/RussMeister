-- RussMeister Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Learner Profiles ──────────────────────────────────────────
CREATE TABLE learner_profiles (
  learner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  assessed_level TEXT NOT NULL CHECK (assessed_level IN ('A1','A2','B1','B2','C1','C2')),
  skill_speaking TEXT NOT NULL DEFAULT 'A1',
  skill_listening TEXT NOT NULL DEFAULT 'A1',
  skill_reading TEXT NOT NULL DEFAULT 'A1',
  skill_writing TEXT NOT NULL DEFAULT 'A1',
  skill_grammar TEXT NOT NULL DEFAULT 'A1',
  skill_vocabulary TEXT NOT NULL DEFAULT 'A1',
  interest_domain TEXT NOT NULL,
  interest_subdomains TEXT[] DEFAULT '{}',
  native_language TEXT NOT NULL DEFAULT 'English',
  session_count INTEGER NOT NULL DEFAULT 0,
  weak_areas TEXT[] DEFAULT '{}',
  strong_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Vocabulary Items ──────────────────────────────────────────
CREATE TABLE vocabulary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id UUID NOT NULL REFERENCES learner_profiles(learner_id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  domain TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'none',
  plural TEXT DEFAULT '',
  example_sentence TEXT DEFAULT '',
  example_translation TEXT DEFAULT '',
  ipa TEXT DEFAULT '',
  level TEXT NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  times_seen INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  difficulty_rating INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_rating BETWEEN 1 AND 5),
  leitner_box INTEGER NOT NULL DEFAULT 0 CHECK (leitner_box BETWEEN 0 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(learner_id, word)
);

-- ─── Grammar Progress ──────────────────────────────────────────
CREATE TABLE grammar_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id UUID NOT NULL REFERENCES learner_profiles(learner_id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  mastered BOOLEAN NOT NULL DEFAULT FALSE,
  accuracy REAL NOT NULL DEFAULT 0,
  times_practiced INTEGER NOT NULL DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(learner_id, topic_id)
);

-- ─── Session Records ───────────────────────────────────────────
CREATE TABLE session_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id UUID NOT NULL REFERENCES learner_profiles(learner_id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  domain TEXT NOT NULL,
  phases_completed TEXT[] DEFAULT '{}',
  vocabulary_introduced TEXT[] DEFAULT '{}',
  vocabulary_reviewed TEXT[] DEFAULT '{}',
  grammar_topic TEXT,
  exercises_completed INTEGER NOT NULL DEFAULT 0,
  exercises_correct INTEGER NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0,
  skill_focus TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ───────────────────────────────────────────────────
CREATE INDEX idx_vocabulary_learner ON vocabulary_items(learner_id);
CREATE INDEX idx_vocabulary_review ON vocabulary_items(learner_id, next_review);
CREATE INDEX idx_grammar_learner ON grammar_progress(learner_id);
CREATE INDEX idx_sessions_learner ON session_records(learner_id);
CREATE INDEX idx_sessions_date ON session_records(learner_id, date DESC);

-- ─── Row Level Security ────────────────────────────────────────
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_records ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
-- (In production, link learner_id to Supabase auth.uid())
CREATE POLICY "Users can view own profile" ON learner_profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON learner_profiles
  FOR UPDATE USING (true);
CREATE POLICY "Users can insert own profile" ON learner_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own vocabulary" ON vocabulary_items
  FOR ALL USING (true);

CREATE POLICY "Users can manage own grammar" ON grammar_progress
  FOR ALL USING (true);

CREATE POLICY "Users can manage own sessions" ON session_records
  FOR ALL USING (true);

-- ─── Updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER learner_profiles_updated_at
  BEFORE UPDATE ON learner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
