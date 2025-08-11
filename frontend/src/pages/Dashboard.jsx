import useAuthStore from "../store/authStore";
import supabase from "../utils/supabaseclient";
import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { user, leetcodeData, isLeetCodeCookieExpired } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log(leetcodeData);

  const checkForNewCookie = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Refresh error:", error);
      } else {
        console.log("Session refreshed successfully");
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  if (isLeetCodeCookieExpired()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="card-base max-w-md w-full text-center">
          <div className="text-white text-3xl font-bold mb-6">
            Cookie expired! 🍪
          </div>
          <p className="text-gray-300 mb-6">
            Please use the browser extension to sync your LeetCode cookie.
          </p>
          <button
            onClick={checkForNewCookie}
            disabled={isRefreshing}
            className="button-base"
          >
            {isRefreshing ? "Checking..." : "Check for New Cookie"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            DSA Analytics Dashboard 📊
          </h1>
          <p className="text-gray-300">
            Welcome back, {user?.user_metadata?.full_name || user?.email}!
            {user?.user_metadata?.leetcode_username && (
              <span className="text-primary ml-2">
                @{user.user_metadata.leetcode_username}
              </span>
            )}
          </p>
        </div>

        {/* Top Row: Topic Accuracy + Streak Heatmap */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Topic Accuracy */}
          <div className="card-base">
            <h2 className="text-xl font-semibold text-white mb-4">
              Topic Mastery
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Arrays</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                  <span className="difficulty-easy text-sm">75%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Graphs</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: "25%" }}
                    ></div>
                  </div>
                  <span className="difficulty-hard text-sm">25%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Dynamic Programming</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: "40%" }}
                    ></div>
                  </div>
                  <span className="difficulty-medium text-sm">40%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Heatmap */}
          <div className="card-base">
            <h2 className="text-xl font-semibold text-white mb-4">
              7-Day Streak
            </h2>
            <div className="flex gap-2 justify-center">
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-xs text-white font-medium">
                3
              </div>
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-xs text-white font-medium">
                2
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                0
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                0
              </div>
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-xs text-white font-medium">
                1
              </div>
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-xs text-white font-medium">
                4
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                0
              </div>
            </div>
            <p className="text-center text-gray-400 text-sm mt-2">
              Last 7 days
            </p>
          </div>
        </div>

        {/* AI Insight */}
        <div className="card-base mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">
            🤖 AI Insight
          </h2>
          <p className="text-primary text-lg">
            "Focus on Graph problems next. Your success rate is low (25%). Try
            BFS/DFS fundamentals."
          </p>
        </div>

        {/* Today's Plan */}
        <div className="card-base">
          <h2 className="text-xl font-semibold text-white mb-4">
            📋 Today's Plan
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-blue-400">📝</span>
              <span className="text-gray-300">2 Problems (Arrays, Graph)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">🗂️</span>
              <span className="text-gray-300">5 Flashcards</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-purple-400">🎯</span>
              <span className="text-gray-300">Mock: Sliding Window</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
