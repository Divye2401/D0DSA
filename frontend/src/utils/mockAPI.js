const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://d0dsa.onrender.com"
    : "http://localhost:4000";
/**
 * Start a new mock interview session
 */
export const createMockInterview = async (userId, filters) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/user/createmock/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filters),
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to start mock interview";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * Send a message during mock interview session
 */
export const sendMockMessage = async (
  sessionId,
  message,
  messageType = "user"
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/user/mockmessage/${sessionId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, messageType }),
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to send message";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * End mock interview session and get feedback
 */
export const endMockInterview = async (sessionId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/user/endmock/${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to end mock interview";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
};
