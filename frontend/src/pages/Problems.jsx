import { useState } from "react";
import Navbar from "../components/Navbar";
import CustomDropdown from "../components/CustomDropdown";

export default function Problems() {
  const [filters, setFilters] = useState({
    topic: "all",
    difficulty: "all",
    company: "all",
  });

  // Mock data for now - later will come from API
  const mockProblems = [
    {
      id: 1,
      title: "Two Sum",
      topic: "Arrays",
      difficulty: "Easy",
      priority: "urgent",
      reason: "Low success rate (20%)",
      leetcodeUrl: "https://leetcode.com/problems/two-sum/",
      companies: ["Amazon", "Google"],
    },
    {
      id: 2,
      title: "Merge Intervals",
      topic: "Greedy",
      difficulty: "Medium",
      priority: "high-impact",
      reason: "High frequency at FAANG",
      leetcodeUrl: "https://leetcode.com/problems/merge-intervals/",
      companies: ["Microsoft", "Meta"],
    },
    {
      id: 3,
      title: "Binary Tree Level Order",
      topic: "Trees",
      difficulty: "Medium",
      priority: "recommended",
      reason: "Good for BFS practice",
      leetcodeUrl:
        "https://leetcode.com/problems/binary-tree-level-order-traversal/",
      companies: ["Apple"],
    },
  ];

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: "bg-red-500/20 text-red-400 border-red-500/30",
      "high-impact": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      recommended: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
    return badges[priority] || badges.recommended;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      urgent: "Urgent",
      "high-impact": "High Impact",
      recommended: "Recommended",
    };
    return labels[priority] || "Recommended";
  };

  // Dropdown options
  const topicOptions = [
    { value: "all", label: "All Topics" },
    { value: "arrays", label: "Arrays" },
    { value: "strings", label: "Strings" },
    { value: "trees", label: "Trees" },
    { value: "graphs", label: "Graphs" },
    { value: "dp", label: "Dynamic Programming" },
  ];

  const difficultyOptions = [
    { value: "all", label: "All Difficulties" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const companyOptions = [
    { value: "all", label: "All Companies" },
    { value: "google", label: "Google" },
    { value: "amazon", label: "Amazon" },
    { value: "microsoft", label: "Microsoft" },
    { value: "meta", label: "Meta" },
    { value: "apple", label: "Apple" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />

      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            💡 AI Problem Recommendations
          </h1>
          <p className="text-gray-300">
            Personalized problems based on your weak topics and interview
            frequency
          </p>
        </div>

        {/* Filter Bar */}
        <div className="card-base mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <CustomDropdown
              label="Topic"
              value={filters.topic}
              onChange={(value) => setFilters({ ...filters, topic: value })}
              options={topicOptions}
              placeholder="Select Topic"
            />

            <CustomDropdown
              label="Difficulty"
              value={filters.difficulty}
              onChange={(value) =>
                setFilters({ ...filters, difficulty: value })
              }
              options={difficultyOptions}
              placeholder="Select Difficulty"
            />

            <CustomDropdown
              label="Company"
              value={filters.company}
              onChange={(value) => setFilters({ ...filters, company: value })}
              options={companyOptions}
              placeholder="Select Company"
            />
          </div>
        </div>

        {/* Problem Cards */}
        <div className="space-y-4">
          {mockProblems.map((problem) => (
            <div key={problem.id} className="card-interactive">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Priority Badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-medium border ${getPriorityBadge(
                        problem.priority
                      )}`}
                    >
                      {getPriorityLabel(problem.priority)}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        problem.difficulty === "Easy"
                          ? "difficulty-easy"
                          : problem.difficulty === "Medium"
                          ? "difficulty-medium"
                          : "difficulty-hard"
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>

                  {/* Title and Topic */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {problem.title} – {problem.topic}
                  </h3>

                  {/* Reason */}
                  <p className="text-gray-300 mb-3">
                    <span className="text-gray-400">Reason:</span>{" "}
                    {problem.reason}
                  </p>

                  {/* Companies */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-400 text-sm">Companies:</span>
                    {problem.companies.map((company) => (
                      <span
                        key={company}
                        className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Open Button */}
                <div className="ml-4">
                  <a
                    href={problem.leetcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-simple inline-block"
                  >
                    Open in LeetCode
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="button-simple">Load More Problems</button>
        </div>
      </div>
    </div>
  );
}
