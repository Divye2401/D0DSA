export default function TodaysPlan({ planData }) {
  // Default plan structure when no data is available
  const defaultPlan = [
    {
      type: "problems",
      icon: "📝",
      iconColor: "text-blue-400",
      description: "2 Problems (Arrays, Graph)",
      completed: false,
    },
    {
      type: "flashcards",
      icon: "🗂️",
      iconColor: "text-green-400",
      description: "5 Flashcards",
      completed: false,
    },
    {
      type: "mock",
      icon: "🎯",
      iconColor: "text-purple-400",
      description: "Mock: Sliding Window",
      completed: false,
    },
  ];

  // Use real data if available, otherwise use default
  const currentPlan = planData || defaultPlan;

  if (!currentPlan || currentPlan.length === 0) {
    return (
      <div className="card-stat-light">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg">📋 Today's Plan</h3>
          <span className="text-gray-400 text-xs">No plan</span>
        </div>
        <div className="text-center py-8">
          <span className="text-4xl mb-2 block">📅</span>
          <p className="text-gray-400 text-sm">
            No study plan available for today
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Generate a plan to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-stat-light">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-lg">📋 Today's Plan</h3>
        <span className="text-gray-400 text-xs">
          {currentPlan.filter((item) => item.completed).length}/
          {currentPlan.length} completed
        </span>
      </div>

      <div className="space-y-3">
        {currentPlan.map((item, index) => (
          <div
            key={index}
            className={`
              flex items-center gap-3 p-3 rounded-lg transition-colors  
              hover:bg-gray-700/30 bg-gray-800/30
              ${item.completed ? "opacity-60" : ""}
            `}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <span className={`text-lg ${item.iconColor}`}>{item.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={` text-sm font-medium truncate max-w-48 ${
                  item.completed ? "line-through text-gray-500" : "text-white"
                }`}
              >
                {item.description}
              </p>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              {item.completed ? (
                <span className="text-green-400 text-sm">✓</span>
              ) : (
                <span className="text-gray-600 text-sm">○</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
