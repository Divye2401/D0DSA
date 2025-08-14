const API_BASE_URL =
  import.meta.env.MODE === "production" ? "" : "http://localhost:4000";

// Upload PDF and generate flashcards
export const uploadPDFAndGenerateFlashcards = async (userId, pdfFile) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    const response = await fetch(
      `${API_BASE_URL}/api/user/flashcards/${userId}`,
      {
        method: "POST",
        body: formData, // No Content-Type header - browser sets it automatically for FormData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upload PDF");
    }

    return await response.json();
  } catch (error) {
    console.error("PDF upload error:", error);
    throw error;
  }
};

// Fetch user's flashcards
export const getUserFlashcards = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/user/flashcards/${userId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData);
      throw new Error(errorData.error);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch flashcards error:", error);
    throw error;
  }
};

// Update flashcard progress (for spaced repetition)
export const updateFlashcardProgress = async (userId, flashcards) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/user/flashcards/${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flashcards }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update flashcard progress");
    }

    return await response.json();
  } catch (error) {
    console.error("Update progress error:", error);
    throw error;
  }
};

export const exportUserFlashcards = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/user/flashcards/export/${userId}`
    );

    if (!response.ok) {
      throw new Error("Failed to export user flashcards");
    }

    return await response.blob();
  } catch (error) {
    console.error("Export user flashcards error:", error);
    throw error;
  }
};
