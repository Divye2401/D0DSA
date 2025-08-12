import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { decryptCookie } from "../scripts/encypt-decrypt.js";
import { LeetCode, Credential } from "leetcode-query";
import { storeUserData } from "../scripts/storeuserleetcodedata.js";

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
