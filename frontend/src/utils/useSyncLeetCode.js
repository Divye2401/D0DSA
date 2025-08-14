const API_BASE_URL =
  import.meta.env.MODE === "production" ? "" : "http://localhost:4000";

/**
 * Helper function to sync user's LeetCode data
 */
export const syncLeetCodeData = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/user/sync-leetcode-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to sync LeetCode data");
  }

  return response.json();
};
