import { create } from "zustand";
import supabase from "../utils/supabaseclient";

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  loading: true,

  // Initialize auth listener - call this once in App.jsx
  initAuth: () => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        user: session?.user || null,
        accessToken: session?.access_token || null,
        loading: false,
      });
    });

    // Listen for auth changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event); // 'SIGNED_IN', 'SIGNED_OUT', etc.
      set({
        user: session?.user || null,
        accessToken: session?.access_token || null,
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
