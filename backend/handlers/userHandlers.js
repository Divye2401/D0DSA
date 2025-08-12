import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { decryptCookie } from "../scripts/encypt-decrypt.js";
import { LeetCode, Credential } from "leetcode-query";

// Load environment variables
dotenv.config({ path: "config.env" });

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Sync user's LeetCode data and store in Supabase
 */
export const syncLeetCodeDataHandler = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: userId",
      });
    }

    // Get user's LeetCode data from user_profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("leetcode_username, leetcode_session_cookie")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found",
        details: profileError?.message || "No profile data",
      });
    }

    const { leetcode_username, leetcode_session_cookie } = userProfile;

    if (!leetcode_username || !leetcode_session_cookie) {
      return res.status(400).json({
        success: false,
        error:
          "LeetCode username or cookie not found. Please sync your cookie first.",
      });
    }

    // Decrypt the cookie using RPC function
    const decryptedCookie = await decryptCookie(leetcode_session_cookie);
    // Fetch solved problems from LeetCode
    const leetcodeData = await fetchUserSolvedProblems(
      leetcode_username,
      decryptedCookie
    );

    if (!leetcodeData) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch LeetCode data",
      });
    }

    // Store the data in Supabase
    const result = await storeUserData(userId, leetcodeData);

    res.json({
      success: true,
      message: "LeetCode data synced successfully",
      data: result,
    });
  } catch (error) {
    console.error("Sync LeetCode data error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Fetch user's solved problems from LeetCode GraphQL API
 */
async function fetchUserSolvedProblems(username, sessionCookie) {
  const query = `
    query userCompleteData($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        submissionCalendar
      }
    }
  `;

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `LEETCODE_SESSION=${sessionCookie}`,
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return null;
    }

    // Get all submissions using LeetCode Query package
    console.log("Difficulty Data Recieved");

    const submissions = await getLeetCodeSubmissions(username, sessionCookie);

    return {
      matchedUser: data.data.matchedUser,
      recentSubmissionList: submissions,
    };
  } catch (error) {
    console.error("Error fetching LeetCode data:", error);
    return null;
  }
}

/**
 * Get all LeetCode submissions using the leetcode-query package
 */
async function getLeetCodeSubmissions(username, sessionCookie) {
  try {
    // Initialize credentials with session cookie
    const credential = new Credential();
    await credential.init(sessionCookie);

    // Create LeetCode instance with credentials
    const leetcode = new LeetCode(credential);

    // Get all submissions for authenticated user
    const submissions = await leetcode.submissions({
      limit: 1000, // Get up to 1000 submissions
      offset: 0,
    });

    console.log(`Retrieved ${submissions.length} submissions`);

    // Map to our expected format
    return submissions.map((sub) => ({
      title: sub.title || "Unknown",
      titleSlug: sub.titleSlug || "unknown",
      timestamp: sub.timestamp.toString(),
      statusDisplay: sub.statusDisplay || "Unknown",
    }));
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
}

/**
 * Store user data in Supabase tables
 */
async function storeUserData(userId, leetcodeData) {
  const { matchedUser, recentSubmissionList } = leetcodeData;
  const { submitStats, submissionCalendar } = matchedUser;

  console.log(
    `Processing ${recentSubmissionList.length} submissions for user ${userId}`
  );

  // 1. Calculate difficulty stats
  const acStats = submitStats.acSubmissionNum;
  const totalStats = submitStats.totalSubmissionNum;

  const easySolved = acStats.find((s) => s.difficulty === "Easy")?.count || 0;
  const mediumSolved =
    acStats.find((s) => s.difficulty === "Medium")?.count || 0;
  const hardSolved = acStats.find((s) => s.difficulty === "Hard")?.count || 0;

  const easySubmissions =
    acStats.find((s) => s.difficulty === "Easy")?.submissions || 0;
  const mediumSubmissions =
    acStats.find((s) => s.difficulty === "Medium")?.submissions || 0;
  const hardSubmissions =
    acStats.find((s) => s.difficulty === "Hard")?.submissions || 0;

  const easyTotalAttempts =
    totalStats.find((s) => s.difficulty === "Easy")?.submissions || 0;
  const mediumTotalAttempts =
    totalStats.find((s) => s.difficulty === "Medium")?.submissions || 0;
  const hardTotalAttempts =
    totalStats.find((s) => s.difficulty === "Hard")?.submissions || 0;

  // 2. Calculate topic mastery and accuracy from submissions
  const { topicMastery, topicAccuracy } = await calculateTopicMastery(
    recentSubmissionList
  );

  // 3. Update leetcode_stats table
  const totalSolved = easySolved + mediumSolved + hardSolved;
  const totalSubmissions =
    easySubmissions + mediumSubmissions + hardSubmissions;
  const totalAttempts =
    easyTotalAttempts + mediumTotalAttempts + hardTotalAttempts;

  console.log("totalSolved", totalSolved);

  console.log("totalSubmissions", totalSubmissions);
  console.log("totalAttempts", totalAttempts);

  const statsData = {
    user_id: userId,
    total_solved: totalSolved,
    easy_solved: easySolved,
    medium_solved: mediumSolved,
    hard_solved: hardSolved,
    total_accuracy:
      totalAttempts > 0 ? (totalSubmissions / totalAttempts) * 100 : 0,
    easy_accuracy:
      easyTotalAttempts > 0 ? (easySubmissions / easyTotalAttempts) * 100 : 0,
    medium_accuracy:
      mediumTotalAttempts > 0
        ? (mediumSubmissions / mediumTotalAttempts) * 100
        : 0,
    hard_accuracy:
      hardTotalAttempts > 0 ? (hardSubmissions / hardTotalAttempts) * 100 : 0,
    submission_calendar: submissionCalendar,
    topic_mastery: topicMastery,
    topic_accuracy: topicAccuracy,
    last_synced: new Date().toISOString(),
  };

  const { error: statsError } = await supabase
    .from("leetcode_stats")
    .upsert(statsData, { onConflict: "user_id" });

  if (statsError) {
    console.error("Error updating leetcode_stats:", statsError);
    throw new Error("Failed to update user stats");
  }

  // 4. Update solved_problems table
  await updateSolvedProblems(userId, recentSubmissionList);

  console.log(`Successfully synced data for user ${userId}`);
  return {
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    accuracy: statsData.accuracy,
    topicMastery,
    submissionsProcessed: recentSubmissionList.length,
  };
}

/**
 * Calculate topic mastery from submission data
 */
async function calculateTopicMastery(submissions) {
  const topicMastery = {};
  const topicStats = {}; // For accuracy calculation

  // Process ALL submissions for accuracy calculation
  for (const submission of submissions) {
    // Get problem details from leetcode_problems table
    const { data: problem } = await supabase
      .from("leetcode_problems")
      .select("topics")
      .eq("slug", submission.titleSlug)
      .single();

    if (problem?.topics) {
      //Each submission
      // topics is stored as array in database
      const topics = Array.isArray(problem.topics)
        ? problem.topics
        : JSON.parse(problem.topics);

      topics.forEach((topic) => {
        // Each topic
        // Initialize topic stats if not exists
        if (!topicStats[topic]) {
          topicStats[topic] = { attempts: 0, successes: 0 };
        }

        // Count all attempts
        topicStats[topic].attempts += 1;

        // Count successes and update mastery
        if (submission.statusDisplay === "Accepted") {
          topicStats[topic].successes += 1;
          topicMastery[topic] = (topicMastery[topic] || 0) + 1;
        }
      });
    }
  }

  // Calculate topic accuracy percentages
  const topicAccuracy = {};
  Object.keys(topicStats).forEach((topic) => {
    const { attempts, successes } = topicStats[topic];
    topicAccuracy[topic] = attempts > 0 ? (successes / attempts) * 100 : 0;
  });

  return { topicMastery, topicAccuracy };
}

/**
 * Update solved_problems table with individual submissions
 */
async function updateSolvedProblems(userId, submissions) {
  const solvedProblemsData = [];

  for (const submission of submissions) {
    // Get problem ID from leetcode_problems table
    const { data: problem } = await supabase
      .from("leetcode_problems")
      .select("id")
      .eq("slug", submission.titleSlug)
      .single();

    if (problem?.id) {
      solvedProblemsData.push({
        user_id: userId,
        problem_id: problem.id,
        problem_name: submission.title,
        solved_at: new Date(parseInt(submission.timestamp)).toISOString(),
        submission_status:
          submission.statusDisplay === "Accepted" ? "Accepted" : "Not Accepted",
      });
    }
  }

  if (solvedProblemsData.length > 0) {
    // Insert all submissions (no unique constraint to conflict with)
    const { error } = await supabase
      .from("solved_problems")
      .insert(solvedProblemsData);

    if (error) {
      console.error("Error inserting solved_problems:", error);
      throw new Error("Failed to insert solved problems");
    }

    console.log(
      `Inserted ${solvedProblemsData.length} solved problems records`
    );
  }
}
