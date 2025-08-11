import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "config.env" });

// Initialize Supabase client with service role (for admin operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const updateProfileHandler = async (req, res) => {
  try {
    const { userId, profileData } = req.body;

    // Validate required fields
    if (!userId || !profileData) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, profileData",
      });
    }

    // Get current user data to check for LeetCode username changes
    const { data: currentUser, error: getUserError } =
      await supabase.auth.admin.getUserById(userId);

    if (getUserError) {
      return res.status(500).json({
        success: false,
        error: "Failed to get current user data",
      });
    }

    const currentUsername = currentUser.user.user_metadata?.leetcode_username;
    const newUsername = profileData.leetcodeUsername;

    // Prepare updated metadata
    let updatedMetadata = {
      ...currentUser.user.user_metadata,
      full_name: profileData.name,
      leetcode_username: newUsername,
    };

    // If LeetCode username changed, clear cookie data
    if (currentUsername !== newUsername) {
      updatedMetadata = {
        ...updatedMetadata,
        leetcode_cookie: null,
        leetcode_cookie_expires: null,
        last_cookie_update: null,
      };
    }

    // Update user metadata
    const { data: updatedUser, error: updateError } =
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: updatedMetadata,
      });

    if (updateError) {
      console.error("Update error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to update user profile",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      usernameChanged: currentUsername !== newUsername,
      data: updatedUser.user.user_metadata,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const syncLeetCodeHandler = async (req, res) => {
  try {
    const { cookie, username } = req.body;

    // Validate required fields
    if (!cookie || !username) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: cookie, username",
      });
    }

    // Validate cookie format (should have value and expires)
    if (!cookie.value) {
      return res.status(400).json({
        success: false,
        error: "Invalid cookie format. Expected {value, expires}",
      });
    }

    // Find user by leetcode_username in metadata
    const { data: users, error: searchError } =
      await supabase.auth.admin.listUsers();

    if (searchError) {
      return res.status(500).json({
        success: false,
        error: "Failed to search users",
      });
    }

    console.log("users", users.users[0].user_metadata);
    // Find user with matching leetcode_username
    const user = users.users.find(
      (u) => u.user_metadata?.leetcode_username === username
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: `No user found with LeetCode username: ${username}`,
      });
    }

    // Update user metadata with LeetCode cookie
    const { data: updatedUser, error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          leetcode_cookie: cookie.value,
          leetcode_cookie_expires: cookie.expires,
          last_cookie_update: new Date().toISOString(),
        },
      });

    if (updateError) {
      console.error("Update error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to update user metadata",
      });
    }

    res.json({
      success: true,
      message: "LeetCode data synced successfully",
      username: username,
      expires: cookie.expires,
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
