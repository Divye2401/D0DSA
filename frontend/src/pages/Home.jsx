import useAuthStore from "../store/authStore";

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="card-dark p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome to DSA Prep! 🎯
        </h1>

        {/* Show user info */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <p className="text-gray-300">
            Welcome, {user?.user_metadata?.full_name || user?.email}!
          </p>
          {user?.user_metadata?.leetcode_username && (
            <p className="text-primary">
              LeetCode: {user.user_metadata.leetcode_username}
            </p>
          )}
        </div>

        <p className="text-gray-300 mb-6">
          Your AI-powered LeetCode interview preparation platform
        </p>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 p-4 rounded-lg border border-primary/30">
            <h3 className="text-lg font-semibold text-white mb-2">
              Coming Soon:
            </h3>
            <ul className="text-gray-300 text-sm space-y-1 text-left">
              <li>• AI Problem Recommendations</li>
              <li>• Smart Flashcard Generator</li>
              <li>• Mock Interview Sessions</li>
              <li>• Progress Analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
