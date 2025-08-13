import { useQuery, useQueryClient } from "@tanstack/react-query";
import { syncLeetCodeData } from "../utils/useSyncLeetCode";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

export function useLeetCodeSync() {
  const { user, isLeetCodeCookieExpired } = useAuthStore();
  const queryClient = useQueryClient();

  const { isLoading, error, refetch } = useQuery({
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

        // Invalidate all queries that depend on leetcode data
        queryClient.invalidateQueries({
          queryKey: ["dashboardStats", user?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["recommendations", user?.id],
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
    retry: false, // Don't auto-retry failed syncs
  });

  // Manual sync function for buttons
  const triggerSync = () => {
    if (isLeetCodeCookieExpired()) {
      toast.error("LeetCode cookie expired! Use extension to sync new cookie.");
      return;
    }

    if (!user?.id) {
      toast.error("Please log in to sync data");
      return;
    }

    refetch();
  };

  return {
    isLoading,
    error,
    triggerSync,
  };
}
