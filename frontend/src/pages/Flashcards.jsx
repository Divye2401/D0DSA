import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/general/Navbar";
import useAuthStore from "../store/authStore";
import {
  uploadPDFAndGenerateFlashcards,
  getUserFlashcards,
  updateFlashcardProgress,
  exportUserFlashcards,
} from "../utils/flashcardAPI";
import { toast } from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function Flashcards() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  // React Query for flashcards
  const {
    data: flashcardsData,
    isLoading: isLoadingCards,
    refetch: refetchFlashcards,
  } = useQuery({
    queryKey: ["flashcards", user?.id],
    queryFn: async () => {
      const result = await getUserFlashcards(user.id);
      // Add known field to each flashcard when fetching
      const flashcardsWithKnown = result.flashcards.map((card) => ({
        ...card,
        known: null, // null = not answered yet, true = known, false = unknown
      }));
      return { flashcards: flashcardsWithKnown };
    },
    enabled: false, // Only fetch manually when user clicks button
    staleTime: Infinity, // Never consider data stale
    retry: false,
  });

  const flashcards = flashcardsData?.flashcards || [];
  const currentFlashcard = flashcards[currentCard];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const handleMarkKnown = () => {
    // Update the known field for current flashcard in React Query cache
    queryClient.setQueryData(["flashcards", user?.id], (oldData) => {
      //Update the cache
      if (!oldData) return oldData;

      const updatedFlashcards = oldData.flashcards.map((card, index) =>
        index === currentCard ? { ...card, known: true } : card
      );

      return { ...oldData, flashcards: updatedFlashcards };
    });

    console.log("Marked as known:", currentFlashcard.id);
    toast.success("Marked as known", {
      id: "mark-known",
      style: {
        backgroundColor: "green",
      },
    });
  };

  const handleMarkUnknown = () => {
    // Update the known field for current flashcard in React Query cache
    queryClient.setQueryData(["flashcards", user?.id], (oldData) => {
      if (!oldData) return oldData;
      const updatedFlashcards = oldData.flashcards.map((card, index) =>
        index === currentCard ? { ...card, known: false } : card
      );

      return { ...oldData, flashcards: updatedFlashcards };
    });

    console.log("Marked as unknown:", currentFlashcard.id);
    toast.success("Marked as unknown", {
      id: "mark-unknown",
      style: {
        backgroundColor: "red",
      },
    });
  };

  const handleEndRevision = async () => {
    if (!user?.id) return;

    try {
      toast.loading("Saving your progress...", { id: "save-progress" });

      // Update progress for all flashcards that were marked (known !== null)
      const markedCards = flashcards.filter((card) => card.known !== null);

      await updateFlashcardProgress(user.id, markedCards);

      toast.success(`Revision session ended!`, {
        id: "save-progress",
      });

      // Clear the session - this will invalidate the query data
      queryClient.setQueryData(["flashcards", user.id], null);
      setCurrentCard(0);
      setIsFlipped(false);
    } catch (error) {
      toast.error("Failed to save progress", { id: "save-progress" });
      console.error("Save progress error:", error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      console.log("PDF uploaded:", file.name);
    } else {
      toast.error("Please upload a PDF only");
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a PDF first");
      return;
    }

    if (!user?.id) {
      toast.error("Please log in to generate flashcards");
      return;
    }

    setIsGenerating(true);

    try {
      toast.loading("Processing PDF and generating flashcards...", {
        id: "pdf-upload",
      });

      const result = await uploadPDFAndGenerateFlashcards(
        user.id,
        uploadedFile
      );

      toast.success(
        `Generated ${result.flashcardsCount} flashcards from PDF!`,
        { id: "pdf-upload" }
      );

      setShowUpload(false);
      setUploadedFile(null);
    } catch (error) {
      toast.error(error.message || "Failed to generate flashcards", {
        id: "pdf-upload",
      });
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!user?.id) {
      toast.error("Please log in to export flashcards");
      return;
    }

    try {
      toast.loading("Generating PDF...", { id: "export-pdf" });

      const blob = await exportUserFlashcards(user.id);

      // Get PDF as blob

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-flashcards.pdf";
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("PDF exported successfully!", { id: "export-pdf" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export PDF", {
        id: "export-pdf",
      });
    }
  };

  const handleStartRevision = async () => {
    if (!user?.id) {
      toast.error("Please log in to start revision session");
      return;
    }

    try {
      toast.loading("Loading your flashcards...", { id: "fetch-cards" });

      const result = await refetchFlashcards();

      if (result.data) {
        setCurrentCard(0);
        setIsFlipped(false);

        toast.success(`Loaded ${result.data.flashcards.length} flashcards!`, {
          id: "fetch-cards",
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to load flashcards", {
        id: "fetch-cards",
        style: {
          fontSize: "12px",
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />

      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            🗂️ AI Flashcard Generator
          </h1>
          <p className="text-gray-300">
            Review concepts and mistakes with AI-generated flashcards
          </p>
        </div>

        {/* Progress Bar */}
        {flashcards.length > 0 && (
          <div className="card-base mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Progress</span>
              <span className="text-gray-300 text-sm">
                {currentCard + 1} / {flashcards.length}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentCard + 1) / flashcards.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Flashcard or Empty State */}
        <div className="mb-6">
          {flashcards.length === 0 ? (
            // Empty State
            <div className="card-base h-80 flex flex-col justify-center items-center text-center">
              <div className="text-6xl mb-4">🗂️</div>
              <h3 className="text-lg font-medium text-gray-200 mb-2">
                No Flashcards Yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start a revision session from your existing flashcards
              </p>
              <button
                onClick={handleStartRevision}
                disabled={isLoadingCards}
                className="button-simple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingCards ? "🔄 Loading..." : "🎯 Start Revision Session"}
              </button>
            </div>
          ) : (
            // Flashcard Display
            <div
              className="relative w-full h-80 cursor-pointer"
              onClick={handleFlip}
            >
              {/* Front Side - Question */}
              <div
                className={`absolute inset-0 w-full h-full transition-all duration-500 ${
                  isFlipped
                    ? "opacity-0 z-0 rotate-y-180"
                    : "opacity-100 z-10 rotate-y-0"
                }`}
              >
                <div className="card-base h-full flex flex-col justify-center items-center text-center">
                  <div className="mb-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        currentFlashcard.difficulty === "Easy"
                          ? "difficulty-easy bg-green-500/20"
                          : currentFlashcard.difficulty === "Medium"
                          ? "difficulty-medium bg-yellow-500/20"
                          : "difficulty-hard bg-red-500/20"
                      }`}
                    >
                      {currentFlashcard.difficulty}
                    </span>
                    <span className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                      {currentFlashcard.topic}
                    </span>
                  </div>
                  <h2 className="text-lg font-medium text-gray-100 mb-4">
                    {currentFlashcard.question}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Click to reveal answer
                  </p>
                </div>
              </div>

              {/* Back Side - Answer */}
              <div
                className={`absolute inset-0 w-full h-full transition-all duration-500 ${
                  isFlipped
                    ? "opacity-100 z-10 rotate-y-0"
                    : "opacity-0 z-0 rotate-y-180"
                }`}
              >
                <div className="card-base h-full flex flex-col justify-center items-center text-center">
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm">
                      Answer
                    </span>
                  </div>
                  <p className="text-gray-200 text-base leading-relaxed mb-4">
                    {currentFlashcard.answer}
                  </p>
                  <p className="text-gray-500 text-sm">Click to flip back</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation & Actions - Right beneath flashcards */}
        {flashcards.length > 0 && (
          <div className="card-base mb-6">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentCard === 0}
                className="button-simple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleMarkUnknown}
                  className="bg-red-500/20 text-red-400 border border-red-500/30 py-2 px-4 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
                >
                  ❌ Unknown
                </button>
                <button
                  onClick={handleMarkKnown}
                  className="bg-green-500/20 text-green-400 border border-green-500/30 py-2 px-4 rounded-lg font-medium hover:bg-green-500/30 transition-colors"
                >
                  ✅ Known
                </button>
              </div>

              <button
                onClick={handleNext}
                disabled={currentCard === flashcards.length - 1}
                className="button-simple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            <div className="text-center mt-3">
              <span className="text-gray-300 text-sm">
                Card {currentCard + 1} of {flashcards.length}
              </span>
            </div>
          </div>
        )}

        {/* Session Actions */}
        {flashcards.length > 0 && (
          <div className="card-base mb-6">
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              Session Actions
            </h3>
            <div className="flex gap-3">
              <button
                onClick={handleStartRevision}
                disabled={isLoadingCards}
                className="flex-1 button-simple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingCards ? "🔄 Loading..." : "🔄 New Session"}
              </button>
              <button
                onClick={handleEndRevision}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 hover:text-white transition-colors"
              >
                🏁 End Revision
              </button>
            </div>
          </div>
        )}

        {/* Upload PDF Section - Always Available */}
        <div className="card-base mb-6">
          <h3 className="text-lg font-medium text-gray-200 mb-4">
            Generate New Flashcards
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex-1 button-simple"
            >
              📄 Upload PDF
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 hover:text-white transition-colors"
            >
              📄 Export PDF
            </button>
          </div>
        </div>

        {/* PDF Upload Section */}
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="card-base mb-6"
          >
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              📄 Upload PDF to Generate Flashcards
            </h3>
            <p className="text-gray-400 mb-4">
              Upload your study notes, textbook chapters, or any PDF document.
              Our AI will extract key concepts and generate flashcards
              automatically.
            </p>

            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />

              {uploadedFile ? (
                <div className="text-green-400">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="text-gray-400">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="font-medium mb-2">Click to upload PDF</p>
                  <p className="text-sm">Drag and drop or click to browse</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleGenerateFlashcards}
                disabled={!uploadedFile || isGenerating}
                className="button-simple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "🔄 Generating..." : "🤖 Generate Flashcards"}
              </button>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setUploadedFile(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
