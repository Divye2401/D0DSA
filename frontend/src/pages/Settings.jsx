import { useState } from "react";

import Navbar from "../components/general/Navbar";
import useAuthStore from "../store/authStore";
import { toast } from "react-hot-toast";

export default function Settings() {
  const { user, logout } = useAuthStore();

  const [userProfile, setUserProfile] = useState({
    name: user?.user_metadata?.full_name || "User",
    leetcodeUsername: user?.user_metadata?.leetcode_username || "",
    avatar: "👨‍💻",
  });

  const [studySettings, setStudySettings] = useState({
    dailyGoal: 3,
    preferredDifficulty: "medium",
    notifications: true,
    reminderTime: "09:00",
    autoSave: true,
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleProfileSave = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/update-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            profileData: {
              name: userProfile.name,
              leetcodeUsername: userProfile.leetcodeUsername,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Profile update failed:", data.error);
        return;
      }

      console.log("Profile updated successfully:", data);

      // If username changed, backend cleared cookies - logout user
      if (data.usernameChanged) {
        toast.error("LeetCode username changed, logging out...");
        setTimeout(async () => {
          await logout();
        }, 3000);
        return;
      }

      // Username didn't change, just update UI
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleStudyPrefsSave = () => {
    toast.success("Study preferences saved");
    console.log("Study preferences saved:", studySettings);
    // TODO: Save to backend/Supabase
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />

      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">⚙️ Settings</h1>
          <p className="text-gray-300">Customize your DSA prep experience</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="card-base">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">👤 Profile</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="button-simple text-sm"
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="text-center">
                <div className="text-6xl mb-2">{userProfile.avatar}</div>
                <button className="text-sm text-primary hover:opacity-80">
                  Change Avatar
                </button>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, name: e.target.value })
                    }
                    disabled={!isEditing}
                    className="input-simple disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    LeetCode Username
                  </label>
                  <input
                    type="text"
                    value={userProfile.leetcodeUsername}
                    onChange={(e) =>
                      setUserProfile({
                        ...userProfile,
                        leetcodeUsername: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    placeholder="your_leetcode_username"
                    className="input-simple disabled:opacity-50"
                  />
                </div>

                {isEditing && (
                  <>
                    <button
                      onClick={handleProfileSave}
                      className="button-simple"
                    >
                      Save Changes
                    </button>
                    <p className="text-sm text-red-400/70">
                      Note: Changing LeetCode username will require you to login
                      again.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Study Preferences */}
          <div className="card-base">
            <h2 className="text-xl font-semibold text-white mb-6">
              📚 Study Preferences
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Daily Problem Goal: {studySettings.dailyGoal} problems
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={studySettings.dailyGoal}
                  onChange={(e) =>
                    setStudySettings({
                      ...studySettings,
                      dailyGoal: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Difficulty
                </label>
                <select
                  value={studySettings.preferredDifficulty}
                  onChange={(e) =>
                    setStudySettings({
                      ...studySettings,
                      preferredDifficulty: e.target.value,
                    })
                  }
                  className="input-simple"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-300">
                    Daily Reminders
                  </h3>
                  <p className="text-xs text-gray-400">
                    Get notified to practice daily
                  </p>
                </div>
                <button
                  onClick={() =>
                    setStudySettings({
                      ...studySettings,
                      notifications: !studySettings.notifications,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    studySettings.notifications ? "bg-primary" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      studySettings.notifications
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {studySettings.notifications && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={studySettings.reminderTime}
                    onChange={(e) =>
                      setStudySettings({
                        ...studySettings,
                        reminderTime: e.target.value,
                      })
                    }
                    className="input-simple"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-300">
                    Auto-save Progress
                  </h3>
                  <p className="text-xs text-gray-400">
                    Automatically save your progress
                  </p>
                </div>
                <button
                  onClick={() =>
                    setStudySettings({
                      ...studySettings,
                      autoSave: !studySettings.autoSave,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    studySettings.autoSave ? "bg-primary" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      studySettings.autoSave ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={handleStudyPrefsSave}
                  className="button-simple"
                >
                  Save Study Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Quirky DSA Message */}
          <div className="card-base">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🤓</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                DSA Ninja in Training! 🥷
              </h2>
              <div className="max-w-2xl mx-auto space-y-3">
                <p className="text-lg text-orange-400 font-medium">
                  "Debugging is like being the detective in a crime movie where
                  you are also the murderer."
                </p>
                <p className="text-gray-300">
                  Remember: Every TLE is just your code asking for more time to
                  think... and every stack overflow is just your recursion
                  getting too excited! 🚀
                </p>
                <div className="flex justify-center items-center gap-2 mt-6">
                  <span className="text-2xl">🔥</span>
                  <span className="text-sm text-gray-400 italic">
                    You've got this! One algorithm at a time.
                  </span>
                  <span className="text-2xl">💪</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
