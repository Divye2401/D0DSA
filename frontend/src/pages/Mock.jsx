import { useState } from "react";
import Navbar from "../components/Navbar";
import CustomDropdown from "../components/CustomDropdown";

export default function Mock() {
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
  const [isTyping, setIsTyping] = useState(false);

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

  const startInterview = () => {
    const initialMessages = [
      {
        id: 1,
        sender: "AI",
        text: `Hi! I'm your AI interviewer. We'll focus on ${sessionSettings.topic} at ${sessionSettings.difficulty} level.`,
        timestamp: new Date(),
      },
    ];

    setMessages(initialMessages);
    setTimeRemaining(sessionSettings.timeLimit * 60);
    setSessionState("active");
  };

  const sendMessage = () => {
    if (!userInput.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      sender: "user",
      text: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => {
        const aiResponse = {
          id: messages.length + 2, // This uses closure value of messages.length
          sender: "ai",
          text: "Great! What's the time complexity?",
          timestamp: new Date(),
        };
        return [...prev, aiResponse];
      });
      setIsTyping(false);
    }, 2000);
  };

  const sendCode = () => {
    if (!codeInput.trim()) return;

    const codeMessage = {
      id: messages.length + 1, // User messages get +1
      sender: "user",
      text: `Here's my code:\n${codeInput}\n`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, codeMessage]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => {
        const aiResponse = {
          id: messages.length + 2, // Add +1 to ensure uniqueness
          sender: "ai",
          text: "Let me review your code... This looks good! Can you walk me through your approach and explain the time complexity?",
          timestamp: new Date(),
        };
        return [...prev, aiResponse];
      });
      setIsTyping(false);
    }, 2000);
  };

  const endInterview = () => {
    setSessionState("completed");
  };

  const resetInterview = () => {
    setSessionState("setup");
    setMessages([]);
    setUserInput("");
    setCodeInput("");
    setTimeRemaining(0);
  };

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
            <h1 className="text-3xl font-bold text-white mb-2">
              🎯 Mock Interview Session
            </h1>
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
                  min="15"
                  max="90"
                  step="15"
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
                  <span>15 min</span>
                  <span>90 min</span>
                </div>
              </div>
            </div>

            <button
              onClick={startInterview}
              className="button-simple text-lg py-3 px-8"
            >
              🚀 Start Interview
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
                {sessionSettings.topic} • {sessionSettings.difficulty}
              </p>
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
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white bg-gray-800/50 hover:bg-red-500/80 border border-gray-700/50 hover:border-red-500/50 transition-all duration-200"
              >
                End Interview
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card-base">
              <h3 className="text-lg font-semibold text-white mb-4">💬 Chat</h3>

              <div className="h-64 overflow-y-auto mb-4 space-y-3">
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
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.sender === "user"
                          ? "bg-orange-500 text-white"
                          : "bg-gray-700 text-gray-100"
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {message.sender === "user" ? "You" : "AI"}
                      </div>
                      <div className="text-sm">{message.text}</div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
                      <div className="text-sm">AI is typing...</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your response..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="card-base">
              <h3 className="text-lg font-semibold text-white mb-4">💻 Code</h3>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="// Write your solution here...
    Example:
    class Solution { 
    public int[] twoSum(int[] nums, int target) {
                   }  
             }"
                className="w-full h-72 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono text-sm resize-none mb-3"
              />
              <button
                onClick={sendCode}
                disabled={!codeInput.trim()}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📤 Send Code for Review
              </button>
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
            <h1 className="text-3xl font-bold text-white mb-2">
              📊 Interview Complete!
            </h1>
            <p className="text-gray-300">Here's your performance summary</p>
          </div>

          <div className="card-base mb-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-orange-500 mb-2">
                {mockScorecard.score}
              </div>
              <div className="text-xl text-gray-300">Overall Score</div>
              <div className="text-gray-400 mt-2">Great job! 🎉</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card-base">
              <h3 className="text-lg font-semibold text-white mb-4">
                ✅ Strengths
              </h3>
              <ul className="space-y-2">
                {mockScorecard.strengths.map((strength, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-gray-300"
                  >
                    <span className="text-green-400">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-base">
              <h3 className="text-lg font-semibold text-white mb-4">
                ⚠️ Improvements
              </h3>
              <ul className="space-y-2">
                {mockScorecard.improvements.map((improvement, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-gray-300"
                  >
                    <span className="text-yellow-400">•</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card-base mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              🧮 Complexity
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Time:</span>
                <span className="ml-2 text-gray-100">
                  {mockScorecard.timeComplexity}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Space:</span>
                <span className="ml-2 text-gray-100">
                  {mockScorecard.spaceComplexity}
                </span>
              </div>
            </div>
          </div>

          <div className="card-base">
            <h3 className="text-lg font-semibold text-white mb-4">
              🎯 Next Steps
            </h3>
            <p className="text-gray-300 mb-4">Try this problem next:</p>
            <div className="bg-gray-800 p-4 rounded-lg">
              <span className="text-orange-400 font-medium">
                {mockScorecard.nextProblem}
              </span>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={resetInterview} className="button-simple">
                🔄 New Interview
              </button>
              <button className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors">
                📚 Generate Flashcards
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
