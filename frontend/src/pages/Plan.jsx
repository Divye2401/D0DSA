import { useState } from "react";
import Navbar from "../components/general/Navbar";
import CustomDropdown from "../components/general/CustomDropdown";

export default function Plan() {
  const [planInputs, setPlanInputs] = useState({
    company: "google",
    days: 7,
    weakTopics: [],
    timePerDay: 3,
  });

  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modifyRequest, setModifyRequest] = useState("");
  const [showModifyInput, setShowModifyInput] = useState(false);

  // Mock generated plan data
  const mockPlan = [
    {
      day: 1,
      problems: ["Two Sum (Easy)", "Add Two Numbers (Medium)"],
      theory: "Arrays & Hash Tables Basics",
      mock: "Easy Array Problems",
      completed: false,
    },
    {
      day: 2,
      problems: ["Longest Substring (Medium)", "Valid Anagram (Easy)"],
      theory: "Sliding Window Technique",
      mock: "Medium Two Pointers",
      completed: false,
    },
    {
      day: 3,
      problems: ["Binary Tree Inorder (Medium)", "Maximum Depth (Easy)"],
      theory: "Tree Traversal Methods",
      mock: "Tree Problems",
      completed: false,
    },
  ];

  // Options for dropdowns
  const companyOptions = [
    { value: "google", label: "Google" },
    { value: "amazon", label: "Amazon" },
    { value: "microsoft", label: "Microsoft" },
    { value: "meta", label: "Meta" },
    { value: "apple", label: "Apple" },
    { value: "all", label: "All Companies" },
  ];

  const topicOptions = [
    "Arrays",
    "Strings",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Hash Tables",
    "Linked Lists",
    "Stacks & Queues",
    "Sorting",
    "Binary Search",
  ];

  const handleTopicToggle = (topic) => {
    setPlanInputs((prev) => ({
      ...prev,
      weakTopics: prev.weakTopics.includes(topic)
        ? prev.weakTopics.filter((t) => t !== topic)
        : [...prev.weakTopics, topic],
    }));
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    console.log("Generating plan with inputs:", planInputs);

    // Later: API call to generate plan
    setTimeout(() => {
      setGeneratedPlan(mockPlan);
      setIsGenerating(false);
    }, 2000);
  };

  const handleModifyPlan = async () => {
    if (!modifyRequest.trim()) {
      alert("Please enter your modification request");
      return;
    }

    console.log("Modifying plan with request:", modifyRequest);
    // Later: API call to modify plan based on user request

    setShowModifyInput(false);
    setModifyRequest("");
    alert("Plan modification request sent! (This is a demo)");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />

      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            📋 AI Daily Plan Generator
          </h1>
          <p className="text-gray-300 p-4">
            Create a personalized multi-day DSA prep plan tailored to your needs
          </p>
        </div>

        {/* Plan Inputs */}
        <div className="card-base mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Plan Settings
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Company & Days */}
            <div className="space-y-4">
              <CustomDropdown
                label="Target Company"
                value={planInputs.company}
                onChange={(value) =>
                  setPlanInputs({ ...planInputs, company: value })
                }
                options={companyOptions}
                placeholder="Select Company"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prep Days: {planInputs.days}
                </label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={planInputs.days}
                  onChange={(e) =>
                    setPlanInputs({
                      ...planInputs,
                      days: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>3 days</span>
                  <span>30 days</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Per Day: {planInputs.timePerDay} hours
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={planInputs.timePerDay}
                  onChange={(e) =>
                    setPlanInputs({
                      ...planInputs,
                      timePerDay: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 hour</span>
                  <span>8 hours</span>
                </div>
              </div>
            </div>

            {/* Weak Topics */}
            <div>
              <span className="block text-sm font-medium text-gray-300 mb-2">
                Weak Topics (Select your focus areas)
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {topicOptions.map((topic) => (
                  <label //Wrapping with label
                    key={topic}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={planInputs.weakTopics.includes(topic)}
                      onChange={() => handleTopicToggle(topic)}
                      className="sr-only"
                    />
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        planInputs.weakTopics.includes(topic)
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                      }`}
                    >
                      <span>
                        {planInputs.weakTopics.includes(topic) ? "✅" : "⬜"}
                      </span>
                      <span>{topic}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="button-simple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "🤖 Generating Plan..." : "🎯 Generate My Plan"}
            </button>
          </div>
        </div>

        {/* Generated Plan */}
        {generatedPlan && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Your Personalized Plan
              </h2>
              <button
                onClick={() => setShowModifyInput(!showModifyInput)}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors"
              >
                📝 Request Changes
              </button>
            </div>

            {/* Modify Request Input */}
            {showModifyInput && (
              <div className="card-base mb-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Request Plan Changes
                </h3>
                <textarea
                  value={modifyRequest}
                  onChange={(e) => setModifyRequest(e.target.value)}
                  placeholder="Suggest any changes you want in the plan. 
Example: 'Make Day 2 easier', 'Add more tree problems', 'Replace hard DP with medium arrays'"
                  className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
                <div className="flex gap-3 mt-3">
                  <button onClick={handleModifyPlan} className="button-simple">
                    ✅ Send the changes!
                  </button>
                  <button
                    onClick={() => setShowModifyInput(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Plan Days */}
            <div className="grid gap-4">
              {generatedPlan.map((dayPlan) => (
                <div key={dayPlan.day} className="card-base">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        📅 Day {dayPlan.day}
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-blue-400">💡</span>
                          <div>
                            <span className="text-gray-300 font-medium">
                              Problems:
                            </span>
                            <ul className="text-gray-400 ml-4">
                              {dayPlan.problems.map((problem, idx) => (
                                <li key={idx}>• {problem}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-green-400">📚</span>
                          <span className="text-gray-300">
                            <span className="font-medium">Theory:</span>{" "}
                            {dayPlan.theory}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-purple-400">🎯</span>
                          <span className="text-gray-300">
                            <span className="font-medium">Mock:</span>{" "}
                            {dayPlan.mock}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <div
                        className={`px-3 py-1 rounded-lg text-sm ${
                          dayPlan.completed
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {dayPlan.completed ? "✅ Done" : "⏳ Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
