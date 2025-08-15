const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://d0dsa.onrender.com"
    : "http://localhost:4000";

/**
 * Helper function to fetch recommended problems for a user
 */
export const fetchRecommendedProblems = async (userId, params = {}) => {
  const { difficulty, topics, company } = params;

  // Build query string
  const queryParams = new URLSearchParams();

  console.log(difficulty, topics, company);

  // Transform and add difficulty if selected
  if (difficulty) {
    const transformedDifficulty =
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    queryParams.append("difficulty", transformedDifficulty);
  }

  // Transform and add topics if selected
  if (topics) {
    const transformedTopic = topics.charAt(0).toUpperCase() + topics.slice(1);
    queryParams.append("topics", transformedTopic);

    if (company) {
      const transformedCompany =
        company.charAt(0).toUpperCase() + company.slice(1);
      queryParams.append("company", transformedCompany);
    }
  }

  console.log(
    `Fetching recommendations for filters: ${queryParams.toString()}`
  );

  const response = await fetch(
    `${API_BASE_URL}/api/user/recommendations/${userId}?${queryParams}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch recommendations");
  }

  return response.json();
};
