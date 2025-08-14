import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "config.env" });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getRecommendationsHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { difficulty, topics, company } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: userId",
      });
    }

    // Build query to filter problems
    let query = supabase //not awaiting here
      .from("leetcode_problems")
      .select(
        "id, title, difficulty, topics, companies, acceptance_rate, frequency_score, slug, like_ratio"
      )
      .eq("is_premium", false) // Only free problems
      .order("frequency_score", { ascending: false }); // Popular first

    // Apply difficulty filter
    if (difficulty && difficulty !== "All") {
      query = query.eq("difficulty", difficulty);
    }

    // Apply topics filter
    if (topics && topics !== "All") {
      query = query.contains("topics", [topics]);
    }

    // Get problems in multiple batches to avoid limits
    let allProblems = [];
    let start = 0;
    const batchSize = 1000;

    while (true) {
      const { data: batch, error } = await query.range(
        start,
        start + batchSize - 1
      );

      if (error) {
        console.error("Leetcode Database error:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch problems",
        });
      }

      if (!batch || batch.length === 0) break;
      allProblems = [...allProblems, ...batch];

      if (batch.length < batchSize) break;
      start += batchSize;
    }

    console.log("Total problems fetched:", allProblems.length);
    const problems = allProblems;

    console.log("Total problems:", problems.length);
    // Get user's solved problems
    const { data: solvedProblems, error: solvedError } = await supabase
      .from("solved_problems")
      .select("problem_id")
      .eq("user_id", userId)
      .eq("submission_status", "Accepted");

    if (solvedError) {
      console.error("Error fetching solved problems:", solvedError);
    }
    console.log("Solved problems:", solvedProblems.length);
    // Get solved problem IDs
    const solvedProblemIds = solvedProblems?.map((p) => p.problem_id) || [];

    // Filter out solved problems
    let unsolvedProblems = problems.filter(
      (problem) => !solvedProblemIds.includes(problem.id)
    );

    // Apply company filter in JavaScript
    if (company && company !== "All") {
      unsolvedProblems = unsolvedProblems.filter((problem) => {
        if (!problem.companies) return false;

        // Convert JSONB to string and search for company name
        const companiesStr = JSON.stringify(problem.companies).toLowerCase();
        return companiesStr.includes(company.toLowerCase());
      });
    }

    // Apply limit after filtering
    const limitedProblemshighFrequency = unsolvedProblems
      .filter((problem) => problem.frequency_score > 50)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    const limitedProblemsmediumFrequency = unsolvedProblems
      .filter(
        (problem) =>
          problem.frequency_score <= 50 && problem.frequency_score > 30
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);

    const limitedProblemslowFrequency = unsolvedProblems
      .filter((problem) => problem.frequency_score <= 30)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    const limitedProblems = [
      ...limitedProblemshighFrequency,
      ...limitedProblemsmediumFrequency,
      ...limitedProblemslowFrequency,
    ];

    // Helper function to calculate company frequency
    const getCompanyFrequency = (companies) => {
      if (!companies || typeof companies !== "object") return 0;

      const uniqueCompanies = new Set();

      // Iterate through each difficulty level (1, 2, 3)
      Object.values(companies).forEach((difficultyArray) => {
        if (Array.isArray(difficultyArray)) {
          difficultyArray.forEach((companyObj) => {
            if (companyObj && companyObj.name) {
              uniqueCompanies.add(companyObj.name);
            }
          });
        }
      });

      return uniqueCompanies.size;
    };

    // Format enhanced recommendations with additional data
    const recommendations = limitedProblems.map((problem, index) => ({
      problem_id: problem.id,
      problem_name: problem.title,
      problem_difficulty: problem.difficulty,
      problem_topics: problem.topics,
      priority_score: problem.frequency_score,
      // New fields from leetcode_problems table
      acceptance_rate: Math.round((problem.acceptance_rate || 0) * 100), // Convert to percentage
      company_frequency: getCompanyFrequency(problem.companies),
      like_dislike_ratio: problem.like_ratio || 0, // Use existing like_ratio field
      leetcode_slug: problem.slug,
    }));

    // Send to AI for pattern insights
    const recommendationsWithInsights = await getAIPatternInsights(
      recommendations,
      difficulty,
      topics,
      company
    );

    recommendationsWithInsights.sort(
      (a, b) => b.priority_score - a.priority_score
    );

    console.log(
      `Got ${recommendationsWithInsights.length} recommendations for filters: ${difficulty}, ${topics}, ${company}`
    );

    res.json({
      success: true,
      data: {
        recommendations: recommendationsWithInsights,
      },
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

async function getAIPatternInsights(
  recommendations,
  difficulty,
  topics,
  company
) {
  try {
    // Create the prompt with recommendations and filters
    const problemsList = recommendations.map(
      (rec, index) => `${index + 1}. "${rec.problem_name}"`
    );

    const activeFilters = [];
    if (difficulty && difficulty !== "all")
      activeFilters.push(`difficulty: ${difficulty}`);
    if (topics && topics !== "all") activeFilters.push(`topics: ${topics}`);
    if (company && company !== "all") activeFilters.push(`company: ${company}`);
    const filtersString = activeFilters.join(", ");

    const prompt = `As a DSA expert, provide practical solving insights for each problem. Be detailed but focused.

Problems:
${problemsList.join("\n")}

For each problem, provide insights in 1-2 sentences that cover:
- The core algorithmic pattern or technique required to solve it efficiently
- Key implementation details, data structures, or optimizations to consider
- Common pitfalls or important edge cases to watch out for

Focus on actionable advice that helps students understand the approach and avoid mistakes.

Return ONLY a JSON array where each object has: problem_name and pattern_insight.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a DSA expert teacher. Provide practical, detailed solving insights that help students understand both the approach and implementation. Be specific about patterns, optimizations, and common mistakes. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0].message.content;

    try {
      // Remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      const aiRecommendations = JSON.parse(cleanResponse);

      // Merge AI pattern insights with our original recommendation data
      const mergedRecommendations = recommendations.map((rec) => {
        const aiRec = aiRecommendations.find(
          (ai) => ai.problem_name === rec.problem_name
        );
        return {
          ...rec,
          pattern_insight:
            aiRec?.pattern_insight ||
            "Practice fundamental problem-solving techniques and algorithmic thinking.",
        };
      });

      return mergedRecommendations;
    } catch (parseError) {
      console.error("Failed to parse AI response, using fallback:", parseError);
      // Fallback: add generic pattern insight
      return recommendations.map((rec) => ({
        ...rec,
        pattern_insight:
          "Practice fundamental problem-solving techniques and algorithmic thinking.",
      }));
    }
  } catch (error) {
    console.error("AI reasoning generation failed:", error);
    // Fallback: return original recommendations with generic pattern insight
    return recommendations.map((rec) => ({
      ...rec,
      pattern_insight:
        "Practice fundamental problem-solving techniques and algorithmic thinking.",
    }));
  }
}
