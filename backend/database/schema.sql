-- DSA Prep App Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  leetcode_username TEXT,
  leetcode_session_cookie TEXT, -- Encrypted storage
  target_companies TEXT[] DEFAULT '{}',
  daily_study_hours INTEGER DEFAULT 2,
  preferred_topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 3. LeetCode Stats (Cached user stats)
CREATE TABLE leetcode_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_solved INTEGER DEFAULT 0,
  easy_solved INTEGER DEFAULT 0,
  medium_solved INTEGER DEFAULT 0,
  hard_solved INTEGER DEFAULT 0,
  topic_accuracy JSONB DEFAULT '{}', -- {"Arrays": 0.75, "Graphs": 0.25}
  streak_data JSONB DEFAULT '{}', -- {"2024-01-15": 3, "2024-01-16": 2}
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Solved Problems (User's solved problems)
CREATE TABLE solved_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  leetcode_problem_id INTEGER REFERENCES leetcode_problems(id),
  solved_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, leetcode_problem_id)
);

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
  ease_factor REAL DEFAULT 2.5, -- For spaced repetition algorithm
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

-- Indexes for better performance
CREATE INDEX idx_leetcode_problems_difficulty ON leetcode_problems(difficulty);
CREATE INDEX idx_leetcode_problems_topics ON leetcode_problems USING GIN(topics);
CREATE INDEX idx_leetcode_problems_companies ON leetcode_problems USING GIN(companies);
CREATE INDEX idx_leetcode_problems_frequency ON leetcode_problems(frequency_score DESC);

CREATE INDEX idx_solved_problems_user_id ON solved_problems(user_id);
CREATE INDEX idx_solved_problems_solved_date ON solved_problems(solved_date DESC);

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

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leetcode_problems_updated_at 
  BEFORE UPDATE ON leetcode_problems 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
