# DSA Prep App - Backend

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

1. Copy `env.example` to `.env`
2. Fill in your credentials:
   - Supabase URL and keys from your Supabase dashboard
   - OpenAI API key from OpenAI dashboard

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL to create all tables and policies

### 4. Scrape LeetCode Problems

```bash
npm run scrape-problems
```

This will:

- Fetch all ~3000+ LeetCode problems
- Process difficulty, topics, and acceptance rates
- Save them to your `leetcode_problems` table
- Take about 5-10 minutes to complete

### 5. Start Development Server

```bash
npm run dev
```

## Scripts

- `npm start` - Production server
- `npm run dev` - Development server with auto-reload
- `npm run scrape-problems` - Populate LeetCode problems database

## API Endpoints (Coming Soon)

- `GET /api/health` - Health check
- `POST /api/sync-leetcode` - Sync user's LeetCode data
- `GET /api/recommendations` - Get AI problem recommendations
- `POST /api/generate-plan` - Generate daily study plan
- `POST /api/mock-session` - Start mock interview session

## Database Tables

1. **user_profiles** - User settings and LeetCode username
2. **leetcode_problems** - Global problems database (~3000 problems)
3. **leetcode_stats** - Cached user stats from LeetCode
4. **solved_problems** - User's solved problems history
5. **daily_plans** - AI-generated study plans
6. **flashcards** - Spaced repetition flashcards
7. **mock_sessions** - Mock interview transcripts and scores

## Security

- Row Level Security (RLS) enabled on all user tables
- Users can only access their own data
- Service role key required for admin operations (like scraping)
- Session cookies stored encrypted (when implemented)
