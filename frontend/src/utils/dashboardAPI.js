const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://d0dsa.onrender.com"
    : "http://localhost:4000";

/**
 * Helper function to fetch dashboard stats for a user
 */
export const fetchDashboardStats = async (userId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/user/dashboard-stats/${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch dashboard stats");
  }

  return response.json();
};
