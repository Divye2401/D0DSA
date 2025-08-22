import { useState, useEffect } from "react";
import Navbar from "../components/general/Navbar";
import CustomDropdown from "../components/general/CustomDropdown";
import { HiMicrophone, HiChartBar } from "react-icons/hi2";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/authStore";
import {
  createMockInterview,
  sendMockMessage,
  endMockInterview,
} from "../utils/mockAPI";

export default function Mock() {
  const { user } = useAuthStore();
  const [sessionState, setSessionState] = useState("setup");
  const [sessionSettings, setSessionSettings] = useState({
    topic: "arrays",
    difficulty: "medium",
    company: "google",
    timeLimit: 45,
  });

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);

  const mockScorecard = {
    score: 85,
    strengths: ["Good problem breakdown", "Correct algorithm choice"],
    improvements: ["Missed edge case", "Could optimize space"],
    timeComplexity: "O(n) - Correct",
    spaceComplexity: "O(1) - Could be improved",
    nextProblem: "Minimum Window Substring",
  };

  const topicOptions = [
    { value: "arrays", label: "Arrays" },
    { value: "strings", label: "Strings" },
    { value: "trees", label: "Trees" },
    { value: "graphs", label: "Graphs" },
    { value: "dynamic programming", label: "Dynamic Programming" },
    { value: "backtracking", label: "Backtracking" },
    { value: "greedy", label: "Greedy" },
    { value: "divide and conquer", label: "Divide and Conquer" },
    { value: "binary search", label: "Binary Search" },
    { value: "bit manipulation", label: "Bit Manipulation" },
    { value: "stack", label: "Stack" },
    { value: "queue", label: "Queue" },
    { value: "heap", label: "Heap" },
    { value: "trie", label: "Trie" },
    { value: "hash table", label: "Hash Table" },
    { value: "linked list", label: "Linked List" },
    { value: "recursion", label: "Recursion" },
  ];

  const difficultyOptions = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const companyOptions = [
    { value: "google", label: "Google" },
    { value: "amazon", label: "Amazon" },
    { value: "microsoft", label: "Microsoft" },
  ];

  const startInterview = async () => {
    if (!user?.id) {
      toast.error("Please log in to start mock interview");
      return;
    }

    setIsStarting(true);
    const loadingToast = toast.loading("🤖 Starting your interview...", {
      duration: Infinity,
    });

    try {
      console.log("Starting interview with settings:", sessionSettings);

      // Call our backend API
      const response = await createMockInterview(user.id, sessionSettings);
      console.log("Interview started:", response);

      // Store session data
      setSessionData(response);

      // Set initial message from AI with the actual problem
      const initialMessages = [
        {
          id: 1,
          sender: "ai",
          text: response.initialMessage,
          timestamp: new Date(),
        },
      ];

      setMessages(initialMessages);
      setTimeRemaining(sessionSettings.timeLimit * 60);
      setSessionState("active");

      toast.success("✅ Interview started! Good luck!", {
        id: loadingToast,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error(error.message || "Failed to start interview", {
        id: loadingToast,
        duration: 3000,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || userInput;
    if (!textToSend.trim()) return;

    if (!sessionData?.sessionId) {
      toast.error("Session not found. Please restart the interview.");
      return;
    }

    const userMessage = {
      id: messages.length + 1,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsAiTyping(true);

    try {
      console.log("Sending message to session:", sessionData.sessionId);

      // Call real API
      const response = await sendMockMessage(sessionData.sessionId, textToSend);
      console.log("AI response received:", response);

      // Add AI response to messages
      const aiResponse = {
        id: response.aiMessage.id,
        sender: "ai",
        text: response.aiMessage.message,
        timestamp: new Date(response.aiMessage.timestamp),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");

      // Add error message to chat
      const errorMessage = {
        id: Math.floor(Math.random() * 100) + 200,
        sender: "ai",
        text: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const endInterview = async () => {
    if (!sessionData?.sessionId) {
      toast.error("Session not found. Cannot generate feedback.");
      setSessionState("completed");
      return;
    }

    setIsEnding(true);
    const loadingToast = toast.loading("🤖 Analyzing your performance...", {
      duration: Infinity,
    });

    try {
      console.log("Ending interview session:", sessionData.sessionId);

      // Call real API to get feedback
      const response = await endMockInterview(sessionData.sessionId);
      console.log("Feedback received:", response);

      // Store feedback data
      setFeedbackData(response);
      setSessionState("completed");

      toast.success("✅ Interview completed! Here's your feedback.", {
        id: loadingToast,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error ending interview:", error);
      toast.error(error.message || "Failed to generate feedback", {
        id: loadingToast,
        duration: 3000,
      });

      // Only transition to completed state if it's not a "no conversation" error
      if (
        !error.message ||
        !error.message.includes("No user messages to analyze")
      ) {
        setSessionState("completed");
      }
      // If no conversation, stay in active state so user can continue chatting
    } finally {
      setIsEnding(false);
    }
  };

  const resetInterview = () => {
    setSessionState("setup");
    setMessages([]);
    setUserInput("");
    setCodeInput("");
    setTimeRemaining(0);
    setSessionData(null);
    setFeedbackData(null);
  };

  // Timer effect - countdown every second
  useEffect(() => {
    let timerid = null;

    if (sessionState === "active" && timeRemaining > 0) {
      timerid = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            toast.error("⏰ Time's up! Interview ending...");
            endInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerid) clearInterval(timerid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Setup Phase
  if (sessionState === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />

        <div className="max-w-4xl mx-auto p-4">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <HiMicrophone className="w-12 h-12 text-orange-400" />
              <h1 className="text-3xl font-bold text-white">
                Mock Interview Session
              </h1>
            </div>
            <p className="text-gray-300">
              Practice with AI interviewer - get real-time feedback
            </p>
          </div>

          <div className="card-base">
            <h2 className="text-xl font-semibold text-white mb-6">
              Interview Settings
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <CustomDropdown
                label="Topic Focus"
                value={sessionSettings.topic}
                onChange={(value) =>
                  setSessionSettings({ ...sessionSettings, topic: value })
                }
                options={topicOptions}
                placeholder="Select Topic"
              />

              <CustomDropdown
                label="Difficulty Level"
                value={sessionSettings.difficulty}
                onChange={(value) =>
                  setSessionSettings({ ...sessionSettings, difficulty: value })
                }
                options={difficultyOptions}
                placeholder="Select Difficulty"
              />

              <CustomDropdown
                label="Company Style"
                value={sessionSettings.company}
                onChange={(value) =>
                  setSessionSettings({ ...sessionSettings, company: value })
                }
                options={companyOptions}
                placeholder="Select Company"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Limit: {sessionSettings.timeLimit} minutes
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={sessionSettings.timeLimit}
                  onChange={(e) =>
                    setSessionSettings({
                      ...sessionSettings,
                      timeLimit: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5 min</span>
                  <span>30 min</span>
                </div>
              </div>
            </div>

            <button
              onClick={startInterview}
              disabled={isStarting}
              className="button-simple text-lg py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? "🤖 Starting..." : "🚀 Start Interview"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Phase
  if (sessionState === "active") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />

        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Live Interview</h1>
              <p className="text-gray-300 capitalize">
                {sessionData?.topic || sessionSettings.topic} •{" "}
                {sessionData?.difficulty || sessionSettings.difficulty} •{" "}
                {sessionData?.company || sessionSettings.company}
              </p>
              {sessionData?.problemTitle && (
                <p className="text-orange-400 font-medium mt-1">
                  Problem: {sessionData.problemTitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-gray-400">Time Left</div>
              </div>
              <button
                onClick={endInterview}
                disabled={isEnding}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white bg-gray-800/50 hover:bg-red-500/80 border border-gray-700/50 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnding ? "Ending..." : "End Interview"}
              </button>
            </div>
          </div>

          {/* Problem Description */}
          {sessionData && (
            <div className="card-base mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                📋 Problem Statement
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-orange-400 font-medium mb-2">
                    Description:
                  </h4>
                  <div className="text-gray-200 whitespace-pre-wrap">
                    {/* Allows us to maintain whitespace order*/}
                    {sessionData.problemDescription}
                  </div>
                </div>
                {sessionData.examples && (
                  <div>
                    <h4 className="text-orange-400 font-medium mb-2">
                      Examples:
                    </h4>
                    <div className="space-y-6">
                      {sessionData.examples.map((example, index) => (
                        <div
                          key={index}
                          className="text-gray-200 whitespace-pre-wrap  "
                        >
                          <div>
                            <p>
                              Input:{" "}
                              {JSON.stringify(example.input).replace(/"/g, " ")}
                            </p>
                            <p>
                              Output:{" "}
                              {JSON.stringify(example.output).replace(
                                /"/g,
                                " "
                              )}
                            </p>
                            <p>Explanation: {example.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {sessionData.constraints && (
                  <div>
                    <h4 className="text-orange-400 font-medium mb-2">
                      Constraints:
                    </h4>
                    <div className="text-gray-200 whitespace-pre-wrap">
                      {sessionData.constraints
                        .split(",")
                        .map((constraint) => constraint.trim())
                        .join("\n")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card-base h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
                💬 <span>Interview Chat</span>
              </h3>

              <div className="flex-1 h-80 overflow-y-auto mb-4 space-y-4 p-2 bg-gray-900/30 rounded-lg ">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start gap-2 max-w-[80%] ${
                        message.sender === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      {/* Message bubble */}
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm ${
                          message.sender === "user"
                            ? "bg-orange-500 text-white rounded-br-md"
                            : "bg-gray-700 text-gray-100 rounded-bl-md border border-gray-600"
                        }`}
                      >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-gray-600 text-gray-200 flex items-center justify-center text-xs font-medium">
                        AI
                      </div>
                      <div className="bg-gray-700 text-gray-100 px-4 py-3 rounded-2xl rounded-bl-md border border-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="text-sm text-gray-300">
                            AI is thinking
                          </div>
                          <div className="flex gap-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>{" "}
                            {/* 3 dots */}
                            <div
                              className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-gray-700/50 pt-4">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask questions, explain your approach..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-full text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!userInput.trim()}
                  className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="card-base h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
                💻 <span>Code Editor</span>
              </h3>
              <div className="flex-1 flex flex-col ">
                <TextareaAutosize
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="// Write your solution here...
// Use proper variable names and add comments
// Think about edge cases and complexity"
                  minRows={10}
                  maxRows={25}
                  className="flex-1 w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm resize-none"
                />

                <div className="flex gap-2 mt-4 border-t border-gray-700/50 pt-4">
                  <button
                    onClick={() =>
                      sendMessage(`Here's my solution:\n${codeInput}\n`)
                    }
                    disabled={!codeInput.trim()}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    📤 Submit Solution
                  </button>
                  <button
                    onClick={() => setCodeInput("")}
                    className="px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed Phase
  if (sessionState === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />

        <div className="max-w-4xl mx-auto p-4">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <HiChartBar className="w-12 h-12 text-orange-400" />
              <h1 className="text-3xl font-bold text-white">
                Interview Complete!
              </h1>
            </div>
            <p className="text-gray-300">Here's your performance summary</p>
          </div>

          <div className="card-base mb-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-orange-500 mb-2">
                {feedbackData?.score || mockScorecard.score}
              </div>
              <div className="text-xl text-gray-300">Overall Score</div>
              <div className="text-gray-400 mt-2">
                {feedbackData?.score >= 8
                  ? "Excellent! 🎉"
                  : feedbackData?.score >= 6
                  ? "Good job! 👍"
                  : feedbackData?.score >= 4
                  ? "Keep practicing! 💪"
                  : "Don't give up! 🌟"}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card-base">
              <h3 className="text-lg font-semibold text-white mb-4">
                ✅ Strengths
              </h3>
              <ul className="space-y-2">
                {(feedbackData?.strengths || mockScorecard.strengths).map(
                  (strength, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-gray-300"
                    >
                      <span className="text-green-400">•</span>
                      {strength}
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="card-base">
              <h3 className="text-lg font-semibold text-white mb-4">
                ⚠️ Improvements
              </h3>
              <ul className="space-y-2">
                {(feedbackData?.improvements || mockScorecard.improvements).map(
                  (improvement, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-gray-300"
                    >
                      <span className="text-yellow-400">•</span>
                      {improvement}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Missed Concepts */}
          {feedbackData?.missedConcepts &&
            feedbackData.missedConcepts.length > 0 && (
              <div className="card-base mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  📝 Missed Concepts
                </h3>
                <ul className="space-y-2">
                  {feedbackData.missedConcepts.map((concept, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-gray-300"
                    >
                      <span className="text-blue-400">•</span>
                      {concept}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="card-base mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              🧮 Complexity
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Time:</span>
                <span className="ml-2 text-gray-100">
                  {feedbackData?.timeComplexity || mockScorecard.timeComplexity}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Space:</span>
                <span className="ml-2 text-gray-100">
                  {feedbackData?.spaceComplexity ||
                    mockScorecard.spaceComplexity}
                </span>
              </div>
            </div>
          </div>

          <div className="card-base">
            <h3 className="text-lg font-semibold text-white mb-4">
              🎯 Next Steps
            </h3>
            <p className="text-gray-300 mb-4">
              {feedbackData ? "AI Recommendations:" : "Try this problem next:"}
            </p>
            <div className="bg-gray-800 p-4 rounded-lg">
              <span className="text-orange-400 font-medium">
                {feedbackData?.nextSteps || mockScorecard.nextProblem}
              </span>
            </div>

            {/* Additional feedback section */}
            {feedbackData?.feedback && (
              <div className="mt-4">
                <h4 className="text-orange-400 font-medium mb-2">
                  Detailed Feedback:
                </h4>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {feedbackData.feedback}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3 mt-6">
              <button onClick={resetInterview} className="button-simple">
                🔄 New Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
