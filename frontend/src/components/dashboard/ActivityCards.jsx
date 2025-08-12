import { FaChartBar, FaFire, FaChartLine, FaCalendarDay } from "react-icons/fa";

export default function ActivityCards({ activityStats }) {
  const {
    weeklyTotal = 0,
    longestStreak = 0,
    averageDaily = 0,
    bestDayOfWeek = "Monday",
  } = activityStats || {};

  // Motivational messages based on values
  const getWeeklyMessage = (total) => {
    if (total < 10) return "Get to Work! 🚀";
    if (total > 10 && total < 30) return "Building strong momentum! 💪";
    if (total > 30 && total < 50) return "Keep pushing! Great progress! 🌟";
    if (total > 50 && total < 70) return "Totally On fire! 🔥";
    return "Absolutely Unstoppable! ⚡";
  };

  const getStreakMessage = (streak) => {
    if (streak === 0) return "Start your streak today! 🎯";
    if (streak <= 3) return "You can do more! 📈";
    if (streak <= 7) return "Impressive numbers! 💫";
    if (streak <= 14) return "Full week streak! 🏆";
    return "Legendary streak! 👑";
  };

  const getAverageMessage = (avg) => {
    if (avg === 0) return "Begin the grind! ⚡";
    if (avg < 5) return "Steady pace! 🐢";
    if (avg > 5 && avg < 10) return "Good rhythm! 🎵";
    if (avg > 10 && avg < 15) return "Submission Beast! 🚀";
    return "Speed demon! ⚡";
  };

  const getDayMessage = (day) => {
    const dayEmojis = {
      Monday:
        "Ah, a Monday warrior — fueled by fresh-week optimism (and maybe 3 coffees).",
      Tuesday:
        "Tuesday? The silent assassin of productivity — no one sees you coming.",
      Wednesday:
        "Midweek master — powering through the slump like it doesn’t exist.",
      Thursday:
        "Thursday hero — racing the clock before Friday brain kicks in.",
      Friday:
        "Friday focus mode? Impressive… most people checked out after lunch.",
      Saturday: "Weekend grinder — working while the world naps. Who hurt you?",
      Sunday:
        "Sunday starter — plotting world domination before Monday even begins.(Youre scary)",
    };
    return dayEmojis[day] || "Coding machine! 🤖";
  };

  const cardsData = [
    {
      title: "Submissions This Week",
      value: weeklyTotal,
      icon: FaChartBar,
      bgColor: "bg-blue-500/10",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      description: getWeeklyMessage(weeklyTotal),
    },
    {
      title: "Longest Streak",
      value: `${longestStreak} days`,
      icon: FaFire,
      bgColor: "bg-orange-500/10",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
      description: getStreakMessage(longestStreak),
    },
    {
      title: "Daily Average Submissions",
      value: averageDaily,
      icon: FaChartLine,
      bgColor: "bg-green-500/10",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      description: getAverageMessage(averageDaily),
    },
    {
      title: "Most Productive Day",
      value: bestDayOfWeek,
      icon: FaCalendarDay,
      bgColor: "bg-purple-500/10",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      description: getDayMessage(bestDayOfWeek),
    },
  ];

  return (
    <div className="flex flex-col gap-4 py-8">
      {cardsData.map((card) => {
        const IconComponent = card.icon;
        return (
          <div key={card.title} className={`card-stat-light ${card.bgColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="stats-title text-md font-bold text-orange-400">
                  {card.title} : {card.value}
                </p>

                <p className="stats-description">{card.description}</p>
              </div>
              <div className={`stats-icon ${card.iconBg}`}>
                <IconComponent className={`text-lg ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
