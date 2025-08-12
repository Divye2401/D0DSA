/**
 * StreakHeatmap - Displays 7-day coding activity streak
 * Props:
 * - streakData: Array of 7 objects with date and count
 */
import ActivityCards from "./ActivityCards";

export default function StreakHeatmap({ streakData = [], activityStats }) {
  // Get activity color based on submission count
  const getActivityColor = (count) => {
    if (count === 0) return "bg-gray-700/50"; // No activity
    if (count <= 2) return "bg-green-400/30"; // Light activity
    if (count <= 5) return "bg-green-400/60"; // Medium activity
    return "bg-green-400"; // High activity
  };

  // Get day abbreviation
  const getDayAbbr = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en", { weekday: "short" });
  };

  // Calculate current streak
  const getCurrentStreak = () => {
    let streak = 0;
    // Count from most recent day backwards
    for (let i = streakData.length - 1; i >= 0; i--) {
      if (streakData[i].count > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Calculate total problems solved this week

  const currentStreak = getCurrentStreak();

  if (!streakData || streakData.length === 0) {
    return (
      <div className="card-stat-light flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔥</div>
          <p className="text-gray-400 text-sm">No streak data available</p>
          <p className="text-gray-500 text-xs mt-1">
            Solve problems daily to build your streak!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-stat-light">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-lg">
          Submissions Past 7 Days
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-400">
            {`${currentStreak} days`}
          </div>
          <div className="text-xs text-gray-400">current streak</div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-3">
        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-2">
          {streakData.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-gray-400 text-xs font-medium">
                {getDayAbbr(day.date)}
              </div>
            </div>
          ))}
        </div>

        {/* Activity Squares */}
        <div className="grid grid-cols-7 gap-2">
          {streakData.map((day, index) => (
            <div
              key={index}
              className={`
                aspect-square rounded-lg border border-gray-600/30 
                flex items-center justify-center text-white text-sm font-semibold
                transition-all duration-300 hover:scale-110 cursor-pointer
                ${getActivityColor(day.count)}
              `}
              title={`${day.date}: ${day.count} problems solved`}
            >
              {day.count}
            </div>
          ))}
        </div>
      </div>

      {/* Motivational Statement */}

      {/* Legend */}
      <div className="mt-6 pb-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Less</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-700/50"></div>
            <div className="w-3 h-3 rounded bg-green-400/30"></div>
            <div className="w-3 h-3 rounded bg-green-400/60"></div>
            <div className="w-3 h-3 rounded bg-green-400"></div>
          </div>
          <span className="text-gray-400">More</span>
        </div>
      </div>

      <div className="mb-8">
        <ActivityCards activityStats={activityStats} />
      </div>
    </div>
  );
}
