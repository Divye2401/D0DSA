import useAuthStore from "../store/authStore";
import supabase from "../utils/supabaseclient";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { syncLeetCodeData } from "../utils/useSyncLeetCode";
import { fetchDashboardStats } from "../utils/dashboardAPI";
import StatsCards from "../components/dashboard/StatsCards";
import RecentActivity from "../components/dashboard/RecentActivity";
import TopicMastery from "../components/dashboard/TopicMastery";
import StreakHeatmap from "../components/dashboard/StreakHeatmap";
import ActivityCards from "../components/dashboard/ActivityCards";
import AIRecommendations from "../components/dashboard/AIRecommendations";
import TodaysPlan from "../components/dashboard/TodaysPlan";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { user, isLeetCodeCookieExpired } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-sync LeetCode data on page load
  // eslint-disable-next-line no-unused-vars
  const { data, isLoading, error } = useQuery({
    // these are all States!!!
    queryKey: ["syncLeetCode", user?.id],
    queryFn: async () => {
      toast.loading("Syncing LeetCode data...", {
        id: "sync-toast",
        duration: Infinity, // Never auto-dismiss
      });

      try {
        const result = await syncLeetCodeData(user?.id);
        toast.success("Data synced successfully!", {
          id: "sync-toast",
          duration: 3000,
        });
        return result;
      } catch (error) {
        toast.error(`Sync failed: ${error.message}`, {
          id: "sync-toast",
          duration: 3000,
        });
        throw error; // Re-throw for React Query
      }
    },
    enabled: !!user?.id && !isLeetCodeCookieExpired(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch dashboard stats (only after sync is complete)
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboardStats", user?.id],
    queryFn: () => fetchDashboardStats(user?.id),
    enabled: !!user?.id && !isLoading, // Only run after sync is complete
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Log dashboard data to console
  console.log("Sync Loading:", isLoading);
  console.log("📊 Dashboard Data:", dashboardData);

  // Handle toast notifications based on sync states

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

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards stats={dashboardData?.data?.stats} />
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <RecentActivity problems={dashboardData?.data?.recentActivity} />
        </div>

        {/* Top Row: Topic Accuracy + Streak Heatmap */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Topic Mastery */}
          <TopicMastery
            mastery={dashboardData?.data?.topicMastery}
            accuracy={dashboardData?.data?.topicAccuracy}
            least={{
              mastery: dashboardData?.data?.leastMastery,
              accuracy: dashboardData?.data?.leastAccuracy,
            }}
          />

          {/* Streak Heatmap */}
          <StreakHeatmap
            streakData={dashboardData?.data?.streakData}
            activityStats={dashboardData?.data?.activityStats}
          />
        </div>

        {/* AI Recommendations */}
        <div className="mb-6">
          <AIRecommendations
            recommendations={dashboardData?.data?.recommendations}
            isLoading={isLoading}
          />
        </div>

        {/* Today's Plan */}
        <TodaysPlan planData={dashboardData?.data?.todaysPlan} />
      </div>
    </div>
  );
}
