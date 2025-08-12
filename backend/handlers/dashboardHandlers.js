import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import OpenAI from "openai";
import {
  parseSubmissionCalendar,
  calculateStreakData,
  calculateLongestStreak,
  calculateAverageDaily,
  calculateBestDayOfWeek,
} from "../scripts/streakfunctions.js";
// Load environment variables
dotenv.config({ path: "config.env" });

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get dashboard stats for a user
 */
export const getDashboardStatsHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: userId",
      });
    }

    // Get user's LeetCode stats
    const { data: stats, error: statsError } = await supabase
      .from("leetcode_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (statsError && statsError.code !== "PGRST116") {
      console.error("Error fetching stats:", statsError);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch user stats",
      });
    }

    // Get recent solved problems for recent activity display with difficulty
    const { data: recentProblems, error: problemsError } = await supabase
      .from("solved_problems")
      .select(
        `
        solved_at, 
        submission_status, 
        problem_name,
        leetcode_problems!inner(difficulty)
      `
      )
      .eq("user_id", userId)
      .eq("submission_status", "Accepted")
      .order("solved_at", { ascending: false })
      .limit(5); // Only need 5 for recent activity

    if (problemsError) {
      console.error("Error fetching recent problems:", problemsError);
    }

    // Process the data for dashboard
    const dashboardData = await processDashboardData(
      stats,
      recentProblems || []
    );

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Process raw data into dashboard format
 */
async function processDashboardData(stats, recentProblems) {
  // Default stats if no data exists
  const defaultStats = {
    total_solved: 0,
    easy_solved: 0,
    medium_solved: 0,
    hard_solved: 0,
    total_accuracy: 0,
    easy_accuracy: 0,
    medium_accuracy: 0,
    hard_accuracy: 0,
    topic_accuracy: {},
    topic_mastery: {},
    last_synced: null,
  };

  const userStats = stats || defaultStats;

  // Parse submission calendar once
  const parsedCalendar = parseSubmissionCalendar(userStats.submission_calendar);
  let streakData = [];
  let longestStreak = 0;
  let averageDaily = 0;
  let bestDayOfWeek = "Monday";

  // Calculate streak stats using parsed calendar
  if (parsedCalendar) {
    streakData = calculateStreakData(parsedCalendar);
    longestStreak = calculateLongestStreak(parsedCalendar);
    averageDaily = calculateAverageDaily(parsedCalendar);
    bestDayOfWeek = calculateBestDayOfWeek(parsedCalendar);
  }

  // Get top and least topics for display (limit to 5 each)
  const topicMastery = getTopTopics(userStats.topic_mastery || {}, 5);
  const topicAccuracy = getTopTopics(userStats.topic_accuracy || {}, 5);
  const leastMastery = getLeastTopics(userStats.topic_mastery || {}, 5);
  const leastAccuracy = getLeastTopics(userStats.topic_accuracy || {}, 5);

  // Generate AI recommendations using OpenAI
  const recommendations = await generateAIRecommendations({
    stats: userStats,
    leastMastery,
    leastAccuracy,
    recentProblems,
  });

  return {
    stats: {
      total_solved: userStats.total_solved,
      easy_solved: userStats.easy_solved,
      medium_solved: userStats.medium_solved,
      hard_solved: userStats.hard_solved,
      total_accuracy: Math.round(userStats.total_accuracy * 10) / 10, // Round to 1 decimal
      easy_accuracy: Math.round(userStats.easy_accuracy * 10) / 10,
      medium_accuracy: Math.round(userStats.medium_accuracy * 10) / 10,
      hard_accuracy: Math.round(userStats.hard_accuracy * 10) / 10,
    },
    topicMastery,
    topicAccuracy,
    leastMastery,
    leastAccuracy,
    streakData,
    // New activity stats
    activityStats: {
      longestStreak,
      averageDaily,
      bestDayOfWeek,
      weeklyTotal: streakData.reduce((sum, day) => sum + day.count, 0), // Calculate from existing streakData
    },
    recommendations, // AI-generated recommendations
    recentActivity: recentProblems, // Last 5 solved problems
    lastSynced: userStats.last_synced,
  };
}

function getTopTopics(topicsObj, limit = 5) {
  if (!topicsObj || typeof topicsObj !== "object") {
    return {};
  }

  const entries = Object.entries(topicsObj);

  // Sort by value (descending) and take top N
  const topEntries = entries.sort(([, a], [, b]) => b - a).slice(0, limit);

  return Object.fromEntries(topEntries);
}

/**
 * Get least N topics sorted by value (lowest first)
 */
function getLeastTopics(topicsObj, limit = 5) {
  if (!topicsObj || typeof topicsObj !== "object") {
    return {};
  }

  const entries = Object.entries(topicsObj);

  // Filter out topics with 0 values (no attempts) and sort by value (ascending)
  const leastEntries = entries
    .filter(([, value]) => value > 0) // Only include topics with some activity
    .sort(([, a], [, b]) => a - b) // Sort ascending (lowest first)
    .slice(0, limit);

  return Object.fromEntries(leastEntries);
}

/**
 * Generate AI recommendations using OpenAI
 */
async function generateAIRecommendations({
  stats,
  leastMastery,
  leastAccuracy,
  recentProblems,
}) {
  try {
    const prompt = `
You are a DSA (Data Structures & Algorithms) mentor analyzing a user's LeetCode performance. 
Based on the data below, provide 2 recommendations on topics with low mastery and 1 on topics with high mastery suggesting problems for each.

User Performance Data:
- Total Solved: ${stats.total_solved} (Easy: ${stats.easy_solved}, Medium: ${
      stats.medium_solved
    }, Hard: ${stats.hard_solved})
- Accuracy: ${stats.total_accuracy?.toFixed(1)}% overall
- Weakest Topics (Mastery): ${Object.keys(leastMastery).join(", ") || "None"}
- Weakest Topics (Accuracy): ${
      Object.keys(leastAccuracy).join(", ") || "None"
    }  
- Recent Problems: ${
      recentProblems?.map((p) => p.problem_name).join(", ") || "None"
    }

Respond with exactly 3 recommendations in this JSON format:
[
  {
    "title": "Focus on Dynamic Programming",
    "message": "Your DP accuracy is low/high. Start with classic problems like Fibonacci and Climbing Stairs.",
    "priority": "high",
    "icon": "🎯"
  }
]

Keep messages concise (max 80 characters), actionable, and encouraging. Use these icons: 🎯📚⚡🔥💪🏆📈🎖️👑📅
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    // Fallback recommendations if OpenAI fails
    return [
      {
        title: "Keep Practicing",
        message: "Consistency is key! Solve at least 1 problem daily.",
        priority: "medium",
        icon: "💪",
      },
    ];
  }
}
