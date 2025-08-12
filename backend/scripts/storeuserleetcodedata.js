import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "config.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function storeUserData(userId, leetcodeData) {
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
  console.log("--------------------------------");
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
  console.log(`Checking ${submissions.length} submissions for duplicates...`);

  // First, get all existing solved problems for this user to check for duplicates
  const { data: existingProblems } = await supabase
    .from("solved_problems")
    .select("problem_id, solved_at")
    .eq("user_id", userId);

  // Create a Set of existing problem entries for fast lookup
  // Normalize existing timestamps to match our new format (.000Z)
  const existingEntries = new Set(
    existingProblems?.map((p) => {
      const normalizedTimestamp = new Date(p.solved_at).toISOString();
      return `${p.problem_id}_${normalizedTimestamp}`;
    }) || []
  );

  const solvedProblemsData = [];
  let duplicatesSkipped = 0;

  for (const submission of submissions) {
    // Get problem ID from leetcode_problems table
    const { data: problem } = await supabase
      .from("leetcode_problems")
      .select("id")
      .eq("slug", submission.titleSlug)
      .single();

    if (problem?.id) {
      const solvedAt = new Date(parseInt(submission.timestamp)).toISOString();
      const entryKey = `${problem.id}_${solvedAt}`;

      // Check if this exact submission already exists
      if (existingEntries.has(entryKey)) {
        duplicatesSkipped++;
        continue;
      }

      solvedProblemsData.push({
        user_id: userId,
        problem_id: problem.id,
        problem_name: submission.title,
        solved_at: solvedAt,
        submission_status:
          submission.statusDisplay === "Accepted" ? "Accepted" : "Not Accepted",
      });
    }
  }

  if (solvedProblemsData.length > 0) {
    // Insert only new submissions
    const { error } = await supabase
      .from("solved_problems")
      .insert(solvedProblemsData);

    if (error) {
      console.error("Error inserting solved_problems:", error);
      throw new Error("Failed to insert solved problems");
    }

    console.log(
      `Inserted ${solvedProblemsData.length} new solved problems records`
    );
  }

  if (duplicatesSkipped > 0) {
    console.log(`Skipped ${duplicatesSkipped} duplicate submissions`);
  }
}
