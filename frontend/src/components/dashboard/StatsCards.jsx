import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFire,
  FaChartBar,
} from "react-icons/fa";
import ProgressBar from "../ProgressBar";

/**
 * StatsCards - Displays main LeetCode statistics using TailwindCSS
 * Props:
 * - stats: { total_solved, easy_solved, medium_solved, hard_solved, total_accuracy }
 */
export default function StatsCards({ stats }) {
  // Default to empty stats if not provided
  const {
    total_solved = 0,
    easy_solved = 0,
    medium_solved = 0,
    hard_solved = 0,
    total_accuracy = 0,
  } = stats || {};

  const statsData = [
    {
      title: "Total Solved",
      value: total_solved,
      icon: FaChartLine,
      bgColor: "bg-blue-500/10",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      description: "Problems completed",
    },
    {
      title: "Easy",
      value: easy_solved,
      icon: FaCheckCircle,
      bgColor: "bg-green-500/10",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      description: "Easy problems",
    },
    {
      title: "Medium",
      value: medium_solved,
      icon: FaExclamationTriangle,
      bgColor: "bg-yellow-500/10",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      description: "Medium problems",
    },
    {
      title: "Hard",
      value: hard_solved,
      icon: FaFire,
      bgColor: "bg-red-500/10",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      description: "Hard problems",
    },
  ];

  return (
    <div>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statsData.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.title} className={`card-stat-light ${stat.bgColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase font-bold tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-white text-2xl font-bold mt-1">
                    {stat.value}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`${stat.iconBg} p-3 rounded-lg`}>
                  <IconComponent className={`text-xl ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Accuracy */}
      <div className="card-stat-light">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold tracking-wide">
              Overall Accuracy
            </p>
            <p className="text-white text-2xl font-bold mt-1">
              {total_accuracy.toFixed(1)}%
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Success rate across all problems
            </p>
          </div>
          <div className="bg-cyan-500/20 p-3 rounded-lg">
            <FaChartBar className="text-xl text-cyan-400" />
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          gradient="from-cyan-500 to-cyan-400"
          width={total_accuracy}
          delay={0}
        />
      </div>
    </div>
  );
}
