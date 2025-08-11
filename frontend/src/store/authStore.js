import { create } from "zustand";
import supabase from "../utils/supabaseclient";

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  leetcodeData: null,
  loading: true,

  // Helper function to check if LeetCode cookie is expired
  isLeetCodeCookieExpired: () => {
    const { leetcodeData } = useAuthStore.getState();
    if (!leetcodeData?.expires) return true;

    const expiryDate = new Date(leetcodeData.expires);
    const now = new Date();
    return now >= expiryDate;
  },

  // Initialize auth listener - call this once in App.jsx
  initAuth: () => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        user: session?.user || null,
        accessToken: session?.access_token || null,
        leetcodeData: session?.user?.user_metadata?.leetcode_cookie
          ? {
              cookie: session.user.user_metadata.leetcode_cookie,
              expires: session.user.user_metadata.leetcode_cookie_expires,
              username: session.user.user_metadata.leetcode_username,
              lastUpdate: session.user.user_metadata.last_cookie_update,
            }
          : null,
        loading: false,
      });
    });

    // Listen for auth changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event); // 'SIGNED_IN', 'SIGNED_OUT', etc.
      set({
        user: session?.user || null,
        accessToken: session?.access_token || null,
        leetcodeData: session?.user?.user_metadata?.leetcode_cookie
          ? {
              cookie: session.user.user_metadata.leetcode_cookie,
              expires: session.user.user_metadata.leetcode_cookie_expires,
              username: session.user.user_metadata.leetcode_username,
              lastUpdate: session.user.user_metadata.last_cookie_update,
            }
          : null,
        loading: false,
      });
    });
  },

  // Logout function
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      return false;
    }
    // The listener will automatically set user to null
    return true;
  },
}));
export default useAuthStore;
