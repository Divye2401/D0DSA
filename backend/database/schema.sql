-- DSA Prep App Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID NOT NULL,
  leetcode_username TEXT NULL,
  leetcode_session_cookie TEXT NULL,
  target_companies TEXT[] NULL DEFAULT '{}'::TEXT[],
  daily_study_hours INTEGER NULL DEFAULT 2,
  preferred_topics TEXT[] NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;


-- 2. LeetCode Stats (Cached user stats)
CREATE TABLE leetcode_stats (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NULL,
  total_solved INTEGER NULL DEFAULT 0,
  easy_solved INTEGER NULL DEFAULT 0,
  medium_solved INTEGER NULL DEFAULT 0,
  hard_solved INTEGER NULL DEFAULT 0,
  topic_accuracy JSONB NULL DEFAULT '{}'::JSONB,
  last_synced TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  topic_mastery JSONB NULL DEFAULT '{}'::JSONB,
  total_accuracy REAL NULL DEFAULT 0,
  easy_accuracy REAL NULL DEFAULT 0,
  medium_accuracy REAL NULL DEFAULT 0,
  hard_accuracy REAL NULL DEFAULT 0,
  submission_calendar TEXT NULL,
  CONSTRAINT leetcode_stats_pkey PRIMARY KEY (id),
  CONSTRAINT leetcode_stats_user_id_key UNIQUE (user_id),
  CONSTRAINT leetcode_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 3. Solved Problems (User's solved problems)
CREATE TABLE solved_problems (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NULL,
  problem_id INTEGER NULL,
  solved_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  submission_status TEXT NULL DEFAULT 'Accepted'::TEXT,
  problem_name TEXT NULL,
  CONSTRAINT solved_problems_pkey PRIMARY KEY (id),
  CONSTRAINT solved_problems_leetcode_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES leetcode_problems (id),
  CONSTRAINT solved_problems_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles (id) ON DELETE CASCADE,
  CONSTRAINT solved_problems_submission_status_check CHECK (
    (
      submission_status = ANY (ARRAY['Accepted'::TEXT, 'Not Accepted'::TEXT])
    )
  )
) TABLESPACE pg_default;

-- 5. Daily Plans (AI-generated study plans)
CREATE TABLE daily_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL, -- Full structured plan
  target_company TEXT,
  prep_days INTEGER,
  hours_per_day INTEGER,
  weak_topics TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Flashcards (Spaced repetition system)
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  source TEXT DEFAULT 'manual', -- 'manual', 'mock_session', 'ai_generated'
  source_id UUID, -- References mock_sessions.id if from mock
  repetition_count INTEGER DEFAULT 0,
  known_factor REAL DEFAULT 2.5, -- For spaced repetition algorithm
  next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Mock Sessions (AI interview practice)
CREATE TABLE mock_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  problem_title TEXT,
  problem_difficulty TEXT CHECK (problem_difficulty IN ('Easy', 'Medium', 'Hard')),
  topic TEXT,
  transcript JSONB DEFAULT '[]', -- Array of chat messages
  score INTEGER CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  missed_concepts TEXT[] DEFAULT '{}',
  session_duration INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE
UPDATE ON user_profiles FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_solved_problems_user_id ON public.solved_problems USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_solved_problems_solved_date ON public.solved_problems USING btree (solved_at DESC) TABLESPACE pg_default;

CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review_date);
CREATE INDEX idx_flashcards_topic ON flashcards(topic);

CREATE INDEX idx_mock_sessions_user_id ON mock_sessions(user_id);
CREATE INDEX idx_mock_sessions_created_at ON mock_sessions(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leetcode_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE solved_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can access own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can access own stats" ON leetcode_stats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own solved problems" ON solved_problems
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own plans" ON daily_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own flashcards" ON flashcards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own mock sessions" ON mock_sessions
  FOR ALL USING (auth.uid() = user_id);

-- LeetCode problems table is public (read-only for authenticated users)
CREATE POLICY "Authenticated users can read problems" ON leetcode_problems
  FOR SELECT USING (auth.role() = 'authenticated');

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';


