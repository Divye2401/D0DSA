import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/general/Navbar";
import CustomDropdown from "../components/general/CustomDropdown";
import useAuthStore from "../store/authStore";
import { fetchRecommendedProblems } from "../utils/recommendationsAPI";
import { useLeetCodeSync } from "../hooks/useLeetCodeSync";
import Spinner from "../components/general/Spinner";
export default function Problems() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    topic: "all",
    difficulty: "all",
    company: "all",
  });

  const { isLoading } = useLeetCodeSync();
  // Use React Query to fetch recommendations
  const {
    data: recommendationsData,
    isFetching: isFetchingRecommendations,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: () =>
      fetchRecommendedProblems(user?.id, {
        difficulty: filters.difficulty,
        topics: filters.topic,
        company: filters.company,
      }),
    enabled: !!user?.id && !isLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const recommendations = recommendationsData?.data?.recommendations || [];

  const getPriorityBadge = (priority) => {
    if (priority > 50) {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    } else if (priority >= 30 && priority < 50) {
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    } else {
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getPriorityLabel = (priority) => {
    if (priority > 50) {
      return "Urgent";
    } else if (priority >= 30 && priority < 50) {
      return "High Impact";
    } else {
      return "Recommended";
    }
  };

  // Dropdown options
  const topicOptions = [
    { value: "All", label: "All Topics" },
    { value: "Array", label: "Arrays" },
    { value: "String", label: "Strings" },
    { value: "Tree", label: "Trees" },
    { value: "Graph", label: "Graphs" },
    { value: "Dynamic Programming", label: "Dynamic Programming" },
    { value: "Linked List", label: "Linked List" },
    { value: "Stack", label: "Stack" },
    { value: "Queue", label: "Queue" },
    { value: "Heap", label: "Heap" },
    { value: "Trie", label: "Trie" },
    { value: "Binary Search", label: "Binary Search" },
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
    { value: "uber", label: "Uber" },
    { value: "twitter", label: "Twitter" },
    { value: "linkedin", label: "LinkedIn" },
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
              onChange={(value) => {
                setFilters({ ...filters, difficulty: value });
              }}
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

          {/* Get Recommendations Button */}
          <div className="border-t border-gray-700/50 pt-4">
            <button
              onClick={refetch}
              disabled={isFetchingRecommendations || !user?.id}
              className="button-simple"
            >
              {isFetchingRecommendations ? "Loading..." : "🎯 Get Problems"}
            </button>

            {recommendations.length > 0 && (
              <p className="text-gray-400 text-sm mt-2">
                Found {recommendations.length} personalized recommendations
              </p>
            )}
            {error && (
              <p className="text-red-400 text-sm mt-2">
                Failed to fetch recommendations: {error.message}
              </p>
            )}
          </div>
        </div>

        {/* Problem Cards */}
        <div className="space-y-4">
          {isFetchingRecommendations ? (
            <div className="flex justify-center items-center h-full">
              <Spinner size={45} />
            </div>
          ) : recommendations.length > 0 ? (
            recommendations.map((problem) => (
              <div
                key={problem.problem_id || problem.id}
                className="card-interactive"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Priority Badge */}
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-medium border ${getPriorityBadge(
                          problem.priority_score
                        )}`}
                      >
                        {getPriorityLabel(problem.priority_score)}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          (problem.problem_difficulty || problem.difficulty) ===
                          "Easy"
                            ? "difficulty-easy"
                            : (problem.problem_difficulty ||
                                problem.difficulty) === "Medium"
                            ? "difficulty-medium"
                            : "difficulty-hard"
                        }`}
                      >
                        {problem.problem_difficulty || problem.difficulty}
                      </span>
                    </div>

                    {/* Title and Topic */}
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {problem.problem_name || problem.title}
                      {(problem.problem_topics || problem.topic) && (
                        <span className="text-gray-400 font-normal">
                          {" – "}
                          {Array.isArray(problem.problem_topics)
                            ? problem.problem_topics.join(", ")
                            : problem.topic}
                        </span>
                      )}
                    </h3>

                    {/* AI Reasoning */}
                    <p className="text-gray-300 mb-3">
                      <span className="text-gray-400">
                        {problem.reasoning ? "AI Insight:" : "Reason:"}
                      </span>{" "}
                      {problem.reasoning || problem.reason}
                    </p>

                    {/* Companies */}
                    {(problem.companies || []).length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-400 text-sm">
                          Companies:
                        </span>
                        {problem.companies.map((company) => (
                          <span
                            key={company}
                            className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Open Button */}
                  <div className="ml-4">
                    <a
                      href={
                        problem.leetcodeUrl ||
                        `https://leetcode.com/problems/${(
                          problem.problem_name || problem.title
                        )
                          ?.toLowerCase()
                          .replace(/\s+/g, "-")}/`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button-simple inline-block"
                    >
                      Open in LeetCode
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="card-base text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No recommendations yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Click "🎯 Get Problems" above to see personalized AI
                  recommendations based on your filters and progress.
                </p>
                <div className="text-sm text-gray-500">
                  ✨ Select filters like difficulty, topic, or company to get
                  targeted suggestions
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
