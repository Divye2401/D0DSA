-- LeetCode Problems Table (for scraper)
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- LeetCode Problems (Global Reference Table)
CREATE TABLE leetcode_problems (
  id INTEGER PRIMARY KEY, -- LeetCode problem ID (1, 2, 3...)
  slug TEXT UNIQUE NOT NULL, -- "two-sum", "add-two-numbers"
  title TEXT NOT NULL, -- "Two Sum", "Add Two Numbers"
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  topics TEXT[] DEFAULT '{}', -- ["Array", "Hash Table"]
  companies JSONB DEFAULT '{}', -- {"Google": 15, "Amazon": 8}
  acceptance_rate REAL DEFAULT 0, -- 0.52 (52%)
  frequency_score INTEGER DEFAULT 0, -- 1-100 popularity ranking
  is_premium BOOLEAN DEFAULT FALSE,
  has_solution BOOLEAN DEFAULT FALSE,
  has_video_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_leetcode_problems_difficulty ON leetcode_problems(difficulty);
CREATE INDEX idx_leetcode_problems_topics ON leetcode_problems USING GIN(topics);
CREATE INDEX idx_leetcode_problems_companies ON leetcode_problems USING GIN(companies);
CREATE INDEX idx_leetcode_problems_frequency ON leetcode_problems(frequency_score DESC);

-- LeetCode problems table is public (read-only for authenticated users)
ALTER TABLE leetcode_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read problems" ON leetcode_problems
  FOR SELECT USING (true);

-- Only service role can insert/update (for scraper)
CREATE POLICY "Service role can manage problems" ON leetcode_problems
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_leetcode_problems_updated_at 
  BEFORE UPDATE ON leetcode_problems 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
