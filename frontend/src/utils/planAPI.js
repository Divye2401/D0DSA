const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export const generateStudyPlan = async (userId, filters) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/plan/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      let errorMessage = "Failed to generate study plan";
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
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server");
    }
    throw error;
  }
};

export const getStudyPlan = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/plan/${userId}`);

    if (!response.ok) {
      let errorMessage = "Failed to get study plan";
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
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server");
    }
    throw error;
  }
};

export const updateStudyPlan = async (userId, modificationRequest) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/plan/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modificationRequest),
    });

    if (!response.ok) {
      let errorMessage = "Failed to update study plan";
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
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server");
    }
    throw error;
  }
};

export const getTodaysTasks = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/user/tasks/today/${userId}`
    );

    if (!response.ok) {
      let errorMessage = "Failed to get today's tasks";
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
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server");
    }
    throw error;
  }
};

export const toggleTaskCompletion = async (userId, taskId, completed) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/user/tasks/toggle/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId, completed }),
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to update task";
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
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server");
    }
    throw error;
  }
};
