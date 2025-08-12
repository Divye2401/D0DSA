import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaFire,
  FaClock,
  FaYoutube,
} from "react-icons/fa";

/**
 * RecentActivity - Displays recently solved problems
 * Props:
 * - problems: Array of recent problems with solved_at, problem_name, submission_status
 */
export default function RecentActivity({ problems = [] }) {
  // Open YouTube search for the problem
  const openYouTubeSearch = (problemName) => {
    const searchQuery = `${problemName} leetcode solution explanation`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      searchQuery
    )}`;
    window.open(youtubeUrl, "_blank");
  };

  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const solvedDate = new Date(timestamp);
    const diffMs = now - solvedDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return solvedDate.toLocaleDateString();
    }
  };

  // Get difficulty icon and color based on actual difficulty data
  const getDifficultyInfo = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return {
          icon: FaCheckCircle,
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          label: "Easy",
        };
      case "Hard":
        return {
          icon: FaFire,
          color: "text-red-400",
          bgColor: "bg-red-500/10",
          label: "Hard",
        };
      case "Medium":
      default:
        return {
          icon: FaExclamationTriangle,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/10",
          label: "Medium",
        };
    }
  };

  if (!problems || problems.length === 0) {
    return (
      <div className="card-stat-light">
        <div className="text-center py-8">
          <FaClock className="text-4xl text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No recent activity</p>
          <p className="text-gray-500 text-xs mt-1">
            Solve some problems to see them here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-stat-light">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Recent Activity</h3>
        <span className="text-gray-400 text-xs">{problems.length} recent</span>
      </div>

      <div className="space-y-3">
        {problems.map((problem, index) => {
          const difficultyInfo = getDifficultyInfo(
            problem.leetcode_problems?.difficulty
          );
          const IconComponent = difficultyInfo.icon;

          return (
            <div
              key={`${problem.problem_name}-${problem.solved_at}-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Difficulty Icon */}
                <div className={`p-2 rounded-lg ${difficultyInfo.bgColor}`}>
                  <IconComponent
                    className={`text-sm ${difficultyInfo.color}`}
                  />
                </div>

                {/* Problem Info */}
                <div>
                  <p className="text-white text-sm font-medium truncate max-w-48">
                    {problem.problem_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${difficultyInfo.bgColor} ${difficultyInfo.color}`}
                    >
                      {difficultyInfo.label}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {problem.submission_status === "Accepted"
                        ? "✓ Solved"
                        : "⚠ Attempted"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time & YouTube Button */}
              <div className="text-right flex flex-row items-center gap-4">
                <button
                  onClick={() => openYouTubeSearch(problem.problem_name)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-200"
                  title={`Watch ${problem.problem_name} solution on YouTube`}
                >
                  <FaYoutube className="text-red-400 text-xs" />
                  <span className="text-red-400 text-xs font-medium">
                    Watch
                  </span>
                </button>
                <p className="text-gray-400 text-xs">
                  {formatTimeAgo(problem.solved_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
