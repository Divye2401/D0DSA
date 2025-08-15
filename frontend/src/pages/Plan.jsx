import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { HiClipboardList } from "react-icons/hi2";
import Navbar from "../components/general/Navbar";
import CustomDropdown from "../components/general/CustomDropdown";
import Spinner from "../components/general/Spinner";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/authStore";
import {
  generateStudyPlan,
  getStudyPlan,
  updateStudyPlan,
  toggleTaskCompletion,
} from "../utils/planAPI";
import { useQueryClient } from "@tanstack/react-query";
import { useLeetCodeSync } from "../hooks/useLeetCodeSync";

export default function Plan() {
  const { user } = useAuthStore();
  const { isFetching } = useLeetCodeSync();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    company: "google",
    days: 7,
    weakTopics: [],
    timePerDay: 3,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [modifyRequest, setModifyRequest] = useState("");
  const [showModifyInput, setShowModifyInput] = useState(false);

  // Fetch existing plan using useQuery
  const {
    data: planData,
    isFetching: isFetchingPlan,
    refetch: refetchPlan,
  } = useQuery({
    queryKey: ["studyPlan", user?.id],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000)); //await to wait
      return getStudyPlan(user.id);
    },
    enabled: !!user?.id && !isFetching,
    staleTime: 180 * 60 * 1000, // 3 hours
  });

  const generatedPlan = planData?.plan;
  console.log("generatedPlan", generatedPlan);

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
    "Array",
    "String",
    "Tree",
    "Graph",
    "Dynamic Programming",
    "Hash Table",
    "Linked List",
    "Stack",
    "Queue",
    "Sorting",
    "Binary Search",
    "Heap",
    "Trie",
    "Backtracking",
    "Two Pointers",
  ];

  console.log(filters);

  // Helper function to get card class based on date comparison
  const getCardClass = () => {
    return "card-base"; // Same background for all days
  };

  // Helper function to get text color based on date comparison
  const getTitleTextColor = (planDate) => {
    const today = new Date().toISOString().split("T")[0];
    if (planDate === today) {
      return "text-white"; // Today - bright orange
    } else {
      return "text-gray-400"; // Past - muted gray
    }
  };

  // Helper function to get header text color for sections
  const getHeaderTextColor = (planDate) => {
    const today = new Date().toISOString().split("T")[0];
    if (planDate === today) {
      return "text-white"; // Today - bright orange for headers
    } else {
      return "text-gray-400"; // Default fallback
    }
  };

  // Helper function to get content text color
  const getContentTextColor = (planDate) => {
    const today = new Date().toISOString().split("T")[0];
    if (planDate === today) {
      return "text-white font-semibold"; // Today - keep current orange
    } else {
      return "text-gray-400";
    }
  };

  const handleTopicToggle = (topic) => {
    setFilters((prev) => ({
      ...prev,
      weakTopics: prev.weakTopics.includes(topic)
        ? prev.weakTopics.filter((t) => t !== topic)
        : [...prev.weakTopics, topic],
    }));
  };

  const handleGeneratePlan = async () => {
    if (!user?.id) {
      toast.error("Please log in to generate a plan");
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading(
      "🤖 Generating your personalized plan...",
      {
        duration: Infinity,
      }
    );

    console.log("Generating plan with inputs:", filters);

    try {
      const response = await generateStudyPlan(user.id, filters);
      console.log("Generated plan:", response);

      // Refetch the plan data to get the latest
      refetchPlan();
      toast.success("✅ Plan generated successfully!", {
        id: loadingToast,
        duration: 3000,
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboardTasks", user.id],
      });
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error(error.message || "Failed to generate plan", {
        id: loadingToast,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModifyPlan = async () => {
    if (!modifyRequest.trim()) {
      toast.error("Please enter your modification request");
      return;
    }

    if (!user?.id) {
      toast.error("Please log in to modify your plan");
      return;
    }

    if (!generatedPlan) {
      toast.error("No plan to modify");
      return;
    }

    setIsModifying(true);
    const loadingToast = toast.loading("🤖 Modifying your plan...", {
      duration: Infinity,
    });

    try {
      const response = await updateStudyPlan(user.id, {
        modificationRequest: modifyRequest,
      });
      console.log("Modified plan:", response);

      // Refetch the plan data to get the latest
      refetchPlan();
      toast.success("✅ Plan modified successfully!", {
        id: loadingToast,
        duration: 3000,
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboardTasks", user.id],
      });

      setShowModifyInput(false);
      setModifyRequest("");
    } catch (error) {
      console.error("Error modifying plan:", error);
      toast.error(error.message || "Failed to modify plan", {
        id: loadingToast,
      });
    } finally {
      setIsModifying(false);
    }
  };

  // Optimistic task toggle using React Query cache
  const handleTaskToggle = async (taskId, completed, taskDate) => {
    const newCompleted = !completed;
    if (!user?.id) {
      toast.error("Please log in to update tasks");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (taskDate !== today) {
      toast.error("You can only toggle tasks for today");
      return;
    }
    try {
      // 1. IMMEDIATELY update the existing planData in React Query cache
      queryClient.setQueryData(["studyPlan", user.id], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          plan: oldData.plan.map((day) => ({
            ...day,
            problemTasks:
              day.problemTasks?.map((task) =>
                task.id === taskId ? { ...task, completed: newCompleted } : task
              ) || [],
            theoryTasks:
              day.theoryTasks?.map((task) =>
                task.id === taskId ? { ...task, completed: newCompleted } : task
              ) || [],
          })),
        };
      });

      // 2. Update backend
      await toggleTaskCompletion(user.id, taskId, newCompleted);
      queryClient.invalidateQueries({
        queryKey: ["dashboardTasks", user.id],
      });

      toast.success(
        newCompleted ? "✅ Task completed!" : "⏳ Task marked incomplete"
      );
    } catch (error) {
      console.error("Error toggling task:", error);
      toast.error("Failed to update task");

      // 3. only on error, refetch to get correct data from server
      refetchPlan();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />

      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <HiClipboardList className="w-12 h-12 text-orange-400" />
            <h1 className="text-3xl font-bold text-white">
              AI Daily Plan Generator
            </h1>
          </div>
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
                value={filters.company}
                onChange={(value) => setFilters({ ...filters, company: value })}
                options={companyOptions}
                placeholder="Select Company"
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prep Days: {filters.days}
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={filters.days}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      days: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 day</span>
                  <span>7 days</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Per Day: {filters.timePerDay} hours
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={filters.timePerDay}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
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
                      checked={filters.weakTopics.includes(topic)}
                      onChange={() => handleTopicToggle(topic)}
                      className="sr-only"
                    />
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.weakTopics.includes(topic)
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                      }`}
                    >
                      <span>
                        {filters.weakTopics.includes(topic) ? "✅" : "⬜"}
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

        {/* Loading State */}
        {isFetchingPlan ? (
          <div className="card-base mb-6">
            <div className="flex items-center justify-center py-8">
              <Spinner />
              <span className="ml-3 text-gray-300">
                Loading your active plan...
              </span>
            </div>
          </div>
        ) : (
          /* Generated Plan */
          generatedPlan && (
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className="card-base mb-4"
                >
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
                    <button
                      onClick={handleModifyPlan}
                      disabled={isModifying}
                      className="button-simple disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isModifying ? "🤖 Modifying..." : "✅ Send the changes!"}
                    </button>
                    <button
                      onClick={() => setShowModifyInput(false)}
                      disabled={isModifying}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Plan Days */}
              <div className="grid gap-4">
                {generatedPlan.map((dayPlan) => (
                  <div key={dayPlan.day} className={getCardClass(dayPlan.date)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3
                          className={`text-lg font-semibold ${getTitleTextColor(
                            dayPlan.date
                          )} mb-3`}
                        >
                          📅{" "}
                          {dayPlan.date
                            ? `${dayPlan.date} (Day ${dayPlan.day})`
                            : `Day ${dayPlan.day}`}
                        </h3>

                        <div className="space-y-3">
                          {/* Problems Row */}
                          <div className="card-stat-light hover:bg-gray-700/50 transition-colors duration-200">
                            <div className="flex items-start gap-3">
                              <span className="text-orange-400 text-xl">
                                💡
                              </span>
                              <div className="flex-1">
                                <span
                                  className={`${getHeaderTextColor(
                                    dayPlan.date
                                  )} font-medium text-base`}
                                >
                                  Problems
                                </span>
                                <div className="flex flex-col gap-2 mt-2">
                                  {(dayPlan.problemTasks || []).map((task) => (
                                    <div
                                      key={task.id}
                                      className="flex items-center gap-3"
                                    >
                                      {/* Checkbox */}
                                      <button
                                        onClick={() =>
                                          handleTaskToggle(
                                            task.id,
                                            task.completed,
                                            task.date
                                          )
                                        }
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                          task.completed
                                            ? "bg-orange-500 border-orange-500"
                                            : "border-gray-400 hover:border-orange-400"
                                        }`}
                                      >
                                        {task.completed && (
                                          <span className="text-white text-xs">
                                            ✓
                                          </span>
                                        )}
                                      </button>

                                      {/* Problem button */}
                                      <button
                                        className={`${getContentTextColor(
                                          dayPlan.date
                                        )} text-sm bg-gray-800/50 hover:bg-gray-700/50 px-3 py-1 rounded-lg border border-gray-700/30 hover:border-orange-400/30 transition-all duration-200 cursor-pointer flex-1 text-left ${
                                          task.completed
                                            ? "line-through opacity-60 bg-green-500/30"
                                            : ""
                                        }`}
                                        onClick={() => {
                                          // Extract problem name and search on LeetCode
                                          const problemName =
                                            task.task_description.split(
                                              " ("
                                            )[0];
                                          const searchUrl = `https://leetcode.com/problems/${problemName}`;
                                          window.open(searchUrl, "_blank");
                                        }}
                                      >
                                        {task.task_description}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Theory Row */}
                          <div className="card-stat-light hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer">
                            <div className="flex items-start gap-3">
                              <span className="text-orange-400 text-xl">
                                📚
                              </span>
                              <div className="flex-1">
                                <span
                                  className={`${getHeaderTextColor(
                                    dayPlan.date
                                  )} font-medium text-base`}
                                >
                                  Theory
                                </span>
                                <div className="flex flex-col gap-2 mt-2">
                                  {(dayPlan.theoryTasks || []).map((task) => (
                                    <div
                                      key={task.id}
                                      className="flex items-start gap-3"
                                    >
                                      {/* Checkbox */}
                                      <button
                                        onClick={() =>
                                          handleTaskToggle(
                                            task.id,
                                            task.completed,
                                            task.date
                                          )
                                        }
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 mt-0.5 flex-shrink-0 ${
                                          task.completed
                                            ? "bg-orange-500 border-orange-500"
                                            : "border-gray-400 hover:border-orange-400"
                                        }`}
                                      >
                                        {task.completed && (
                                          <span className="text-white text-xs">
                                            ✓
                                          </span>
                                        )}
                                      </button>

                                      {/* Theory content */}
                                      <p
                                        className={`${getContentTextColor(
                                          dayPlan.date
                                        )} text-sm leading-relaxed flex-1 rounded-lg px-3 py-1 ${
                                          task.completed
                                            ? "line-through opacity-60 bg-green-500/30"
                                            : ""
                                        }`}
                                      >
                                        {task.task_description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tips & Pitfalls Row */}
                          <div className="grid md:grid-cols-2 gap-3">
                            {/* Study Tips */}
                            <div className="card-stat-light hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-start gap-3">
                                <span className="text-orange-400 text-xl">
                                  💡
                                </span>
                                <div className="flex-1">
                                  <span
                                    className={`${getHeaderTextColor(
                                      dayPlan.date
                                    )} font-medium text-base`}
                                  >
                                    Study Tips
                                  </span>
                                  <p
                                    className={`${getContentTextColor(
                                      dayPlan.date
                                    )} text-sm mt-2 leading-relaxed`}
                                  >
                                    {dayPlan.suggestions}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Common Pitfalls */}
                            <div className="card-stat-light hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-start gap-3">
                                <span className="text-orange-400 text-xl">
                                  ⚠️
                                </span>
                                <div className="flex-1">
                                  <span
                                    className={`${getHeaderTextColor(
                                      dayPlan.date
                                    )} font-medium text-base`}
                                  >
                                    Common Pitfalls
                                  </span>
                                  <p
                                    className={`${getContentTextColor(
                                      dayPlan.date
                                    )} text-sm mt-2 leading-relaxed`}
                                  >
                                    {dayPlan.pitfalls}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Estimated Time */}
                          {dayPlan.estimatedTime && (
                            <div className="card-stat-light hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer">
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-orange-400 text-xl">
                                  ⏱️
                                </span>
                                <span
                                  className={`${getHeaderTextColor(
                                    dayPlan.date
                                  )} font-medium text-base`}
                                >
                                  Estimated Time:
                                </span>
                                <span
                                  className={`${getContentTextColor(
                                    dayPlan.date
                                  )} text-base font-semibold`}
                                >
                                  {dayPlan.estimatedTime}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
