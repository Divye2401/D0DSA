export default function AIRecommendations({ recommendations, isLoading }) {
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-red-500/10",
          bgHover: "hover:bg-red-500/30",
          text: "text-red-400",
          iconBg: "bg-red-500/20",
          iconColor: "text-red-400",
          badge: "bg-red-500/20 text-red-400",
        };
      case "medium":
        return {
          bg: "bg-yellow-500/10",
          bgHover: "hover:bg-yellow-500/30",
          text: "text-yellow-400",
          iconBg: "bg-yellow-500/20",
          iconColor: "text-yellow-400",
          badge: "bg-yellow-500/20 text-yellow-400",
        };
      case "low":
        return {
          bg: "bg-green-500/10",
          bgHover: "hover:bg-green-500/30",
          text: "text-green-400",
          iconBg: "bg-green-500/20",
          badge: "bg-green-500/20 text-green-400",
        };
      default:
        return {
          bg: "bg-gray-600/10",
          bgHover: "hover:bg-gray-600/30",
          text: "text-gray-400",
          iconBg: "bg-gray-600/20",
          iconColor: "text-gray-400",
          badge: "bg-gray-600/20 text-gray-400",
        };
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return "Urgent";
      case "medium":
        return "Important";
      case "low":
        return "Good to Know";
      default:
        return "Suggestion";
    }
  };

  if (isLoading) {
    return (
      <div className="card-stat-light">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg">
            🤖 AI Recommendations
          </h3>
          <span className="text-gray-400 text-xs">Loading...</span>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-gray-400 text-sm">Generating recommendations...</p>
          <p className="text-gray-500 text-xs mt-1">
            Analyzing your LeetCode performance
          </p>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="card-stat-light">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg">
            🤖 AI Recommendations
          </h3>
          <span className="text-gray-400 text-xs">No data</span>
        </div>
        <div className="text-center py-8">
          <span className="text-4xl mb-2 block">🎯</span>
          <p className="text-gray-400 text-sm">
            Complete your LeetCode sync to get personalized recommendations!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-stat-light">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-lg">
          🤖 AI Recommendations
        </h3>
        <span className="text-gray-400 text-xs">
          {recommendations.length} suggestions
        </span>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const styles = getPriorityStyles(rec.priority);
          return (
            <div
              key={index}
              className={`
                p-3 rounded-lg transition-all duration-200 ${styles.bgHover}
                bg-gray-800/30 ${styles.bg}
              `}
            >
              {/* Content */}
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                  <span className="text-sm">{rec.icon}</span>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={`font-medium text-sm ${styles.text}`}>
                      {rec.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${styles.badge}`}
                    >
                      {getPriorityLabel(rec.priority)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {rec.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
