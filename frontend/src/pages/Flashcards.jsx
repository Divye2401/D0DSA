import { useState, useRef } from "react";
import Navbar from "../components/general/Navbar";

export default function Flashcards() {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  // Mock flashcard data - later will come from API
  const mockFlashcards = [
    {
      id: 1,
      question: "What's the time complexity of Binary Search?",
      answer: "O(log n) - We eliminate half the search space in each iteration",
      difficulty: "Easy",
      userNotes: "Remember: always divide by 2, that's why it's logarithmic",
    },
    {
      id: 2,
      question: "What's the space complexity of DFS on a binary tree?",
      answer:
        "O(h) where h is the height of the tree. In worst case O(n) for skewed tree, O(log n) for balanced tree",
      topic: "Trees",
      difficulty: "Medium",
      userNotes: "",
    },
    {
      id: 3,
      question: "When should you use a HashMap vs TreeMap?",
      answer:
        "HashMap: O(1) average operations, unordered. TreeMap: O(log n) operations, maintains sorted order",
      topic: "Hash Tables",
      difficulty: "Medium",
      userNotes: "HashMap for speed, TreeMap for sorted data",
    },
  ];

  const currentFlashcard = mockFlashcards[currentCard];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCard < mockFlashcards.length - 1) {
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
    console.log("Marked as known:", currentFlashcard.id);
    // Later: API call to update card status
    handleNext();
  };

  const handleMarkUnknown = () => {
    console.log("Marked as unknown:", currentFlashcard.id);
    // Later: API call to update card status
    handleNext();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (
      file &&
      (file.type === "application/pdf" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "text/plain")
    ) {
      setUploadedFile(file);
      console.log("PDF uploaded:", file.name);
    } else {
      alert("Please upload a PDF, DOCX, or TXT file only");
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!uploadedFile) {
      alert("Please upload a PDF first");
      return;
    }

    setIsGenerating(true);
    console.log("Generating flashcards from PDF:", uploadedFile.name);

    // Later: API call to process PDF and generate flashcards
    setTimeout(() => {
      setIsGenerating(false);
      setShowUpload(false);
      alert("Flashcards generated successfully! (This is a demo)");
    }, 3000);
  };

  const handleExportPDF = () => {
    console.log("Exporting flashcards to PDF...");
    // Later: PDF export functionality
    alert("PDF export feature coming soon!");
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
        <div className="card-base mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Progress</span>
            <span className="text-gray-300 text-sm">
              {currentCard + 1} / {mockFlashcards.length}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentCard + 1) / mockFlashcards.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-6">
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
                <h2 className="text-xl font-semibold text-white mb-4">
                  {currentFlashcard.question}
                </h2>
                <p className="text-gray-400 text-sm">Click to reveal answer</p>
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
                <p className="text-gray-100 text-lg leading-relaxed mb-4">
                  {currentFlashcard.answer}
                </p>
                <p className="text-gray-400 text-sm">Click to flip back</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="card-base">
            <h3 className="text-lg font-semibold text-white mb-4">
              How well do you know this?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={handleMarkKnown}
                className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 py-3 px-4 rounded-lg font-medium hover:bg-green-500/30 transition-colors"
              >
                ✅ Known
              </button>
              <button
                onClick={handleMarkUnknown}
                className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 py-3 px-4 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
              >
                ❌ Unknown
              </button>
            </div>
          </div>

          <div className="card-base">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 py-3 px-4 rounded-lg font-medium hover:bg-blue-500/30 transition-colors"
              >
                📄 Upload PDF
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 py-3 px-4 rounded-lg font-medium hover:bg-purple-500/30 transition-colors"
              >
                📄 Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* PDF Upload Section */}
        {showUpload && (
          <div className="card-base mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              📄 Upload PDF to Generate Flashcards
            </h3>
            <p className="text-gray-300 mb-4">
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
                accept=".pdf,.docx,.txt"
                className="hidden"
              />

              {uploadedFile ? (
                <div className="text-green-400">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
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
          </div>
        )}

        {/* Navigation */}
        <div className="card-base">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentCard === 0}
              className="button-simple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="text-center">
              <span className="text-gray-300">
                Card {currentCard + 1} of {mockFlashcards.length}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={currentCard === mockFlashcards.length - 1}
              className="button-simple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
