/**
 * LeetCode Problems Scraper using GraphQL API
 * This script fetches all LeetCode problems and saves them to Supabase
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "config.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fetch all problems from LeetCode GraphQL API
 */
const fetchLeetCodeProblems = async () => {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        total: totalNum
        questions: data {
          acRate
          difficulty
          freqBar
          frontendQuestionId: questionFrontendId
          isFavor
          paidOnly: isPaidOnly
          status
          title
          titleSlug
          topicTags {
            name
            id
            slug
          }
          hasSolution
          hasVideoSolution
        }
      }
    }
  `;

  console.log("🚀 Fetching problems from LeetCode GraphQL API...");

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com/problemset/all/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        query,
        variables: {
          categorySlug: "",
          skip: 0,
          limit: 4000, // Get all problems (currently ~3000)
          filters: {},
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const problems = data.data?.problemsetQuestionList?.questions || [];
    console.log(`✅ Successfully fetched ${problems.length} problems`);

    return problems;
  } catch (error) {
    console.error("❌ Error fetching problems:", error);
    throw error;
  }
};

/**
 * Get additional problem details (for company frequency data)
 */
const fetchCompanyData = async (titleSlug) => {
  const query = `
    query getCompanyData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        difficulty
        likes
        dislikes
        companyTagStats
        stats
        topicTags {
          name
        }
      }
    }
  `;

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `LEETCODE_SESSION=${process.env.LEETCODE_COOKIE}`,
        Referer: `https://leetcode.com/problems/${titleSlug}/`,

        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug },
      }),
    });

    const data = await response.json();

    return data.data?.question || null;
  } catch (error) {
    console.warn(
      `⚠️  Could not fetch details for ${titleSlug}:`,
      error.message
    );
    return null;
  }
};

/**
 * Process and clean problem data
 */
const processProblemData = (problem, detailsData = null) => {
  // Parse company frequency if available

  let companies = {};
  if (detailsData?.companyTagStats) {
    try {
      companies = JSON.parse(detailsData.companyTagStats);
    } catch (e) {
      companies = {};
    }
  }

  // Calculate frequency score (0-100) based on various factors
  const companyCount = Object.values(companies).flat().length; // number of companies
  const totalCompanyEncounters = Object.values(companies) // total number of encounters
    .flat()
    .reduce((sum, comp) => sum + (comp.timesEncountered || 0), 0);

  const frequencyScore = Math.min(
    100,
    Math.floor(
      // LeetCode frequency (0-75 points)
      Math.min(15, problem.acRate / 5) + // Acceptance rate bonus (0-15 points)
        (problem.hasSolution ? 15 : 0) + // Has solution bonus (0-15 points)
        Math.min(25, companyCount * 4) + // Company diversity (0-25 points)
        Math.min(20, totalCompanyEncounters / 5) // Company frequency (0-20 points)
    )
  );

  return {
    id: parseInt(problem.frontendQuestionId),
    slug: problem.titleSlug,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topicTags.map((tag) => tag.name),
    companies: companies,
    acceptance_rate: problem.acRate / 100,
    frequency_score: frequencyScore,
    is_premium: problem.paidOnly,
    has_solution: problem.hasSolution,
    has_video_solution: problem.hasVideoSolution,
    likes: detailsData?.likes || 0,
    dislikes: detailsData?.dislikes || 0,
    stats: detailsData?.stats ? JSON.parse(detailsData.stats) : {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

/**
 * Save problems to Supabase in batches
 */
const saveProblemsToDatabase = async (problems) => {
  console.log(`💾 Saving ${problems.length} problems to database...`);

  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < problems.length; i += batchSize) {
    const batch = problems.slice(i, i + batchSize);

    try {
      const { data, error } = await supabase
        .from("leetcode_problems")
        .upsert(batch, {
          onConflict: "id",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(
          `❌ Batch ${Math.floor(i / batchSize) + 1} failed:`,
          error
        );
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(
          `✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            problems.length / batchSize
          )} saved successfully`
        );
      }
    } catch (error) {
      console.error(
        `❌ Unexpected error in batch ${Math.floor(i / batchSize) + 1}:`,
        error
      );
      errorCount += batch.length;
    }

    // Rate limiting - be nice to the database
    if (i + batchSize < problems.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`\n📊 Save Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(
    `   📈 Success Rate: ${((successCount / problems.length) * 100).toFixed(
      1
    )}%`
  );
};

/**
 * Utility function for delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Main scraper function
 */
const scrapeLeetCodeProblems = async () => {
  console.log("🔍 Starting LeetCode Problems Scraper...\n");

  try {
    // Step 1: Fetch all problems
    const rawProblems = await fetchLeetCodeProblems();

    if (rawProblems.length === 0) {
      throw new Error("No problems fetched from LeetCode");
    }

    // Step 2: Process basic problem data
    console.log("🔄 Processing problem data...");
    const processedProblems = rawProblems.map((problem) =>
      processProblemData(problem)
    );

    // Step 3: Enhance with detailed data (optional - can be slow)
    console.log("🔍 Enhancing with detailed data (this may take a while)...");
    const enhancedProblems = [];

    for (let i = 0; i < processedProblems.length; i++) {
      // Limit to first 50 for demo
      const problem = processedProblems[i];

      try {
        const detailsData = await fetchCompanyData(problem.slug);

        const enhanced = processProblemData(rawProblems[i], detailsData);
        enhancedProblems.push(enhanced);

        if (i % 10 === 0) {
          console.log(
            `   Enhanced ${i + 1}/${processedProblems.length} problems...`
          );
        }

        // Rate limiting for detailed requests
        await sleep(1000);
      } catch (error) {
        console.warn(`⚠️  Skipping details for ${problem.title}`);
        enhancedProblems.push(problem);
      }
    }

    // Add remaining problems without enhanced data

    // Step 4: Save to database
    await saveProblemsToDatabase(enhancedProblems);

    console.log("\n🎉 Scraping completed successfully!");
    console.log(`📈 Total problems processed: ${enhancedProblems.length}`);
  } catch (error) {
    console.error("\n💥 Scraping failed:", error);
    process.exit(1);
  }
};

// Run the scraper
// Check if this file is being run directly
if (process.argv[1].includes("scrape-leetcode-problems.js")) {
  console.log("✅ Running scraper directly");
  scrapeLeetCodeProblems();
} else {
  console.log("📦 File imported as module");
}

export { scrapeLeetCodeProblems, fetchLeetCodeProblems, fetchCompanyData };
