import TopicSection from "./TopicSection";
import { useEffect, useState } from "react";

export default function TopicMastery({
  mastery = {},
  accuracy = {},
  least = {},
}) {
  const mockData = {
    "Topic 1": 1,
    "Topic 2": 1,
    "Topic 3": 1,
    "Topic 4": 1,
    "Topic 5": 1,
  };

  // Check if we have real data
  const hasRealData =
    Object.keys(mastery).length > 0 &&
    Object.keys(accuracy).length > 0 &&
    Object.keys(least.mastery).length > 0 &&
    Object.keys(least.accuracy).length > 0;

  // Use real data if available, otherwise use mock data
  const currentMost = hasRealData
    ? { mastery, accuracy }
    : { mastery: mockData, accuracy: mockData };

  const currentLeast = hasRealData
    ? least
    : { mastery: mockData, accuracy: mockData };

  // Process data into consistent format
  const processData = (masteryObj, accuracyObj) => {
    const masteryData = Object.entries(masteryObj).map(([topic, value]) => ({
      name: topic,
      value,
      type: "mastery",
    }));

    const accuracyData = Object.entries(accuracyObj).map(([topic, value]) => ({
      name: topic,
      value,
      type: "accuracy",
    }));

    return { masteryData, accuracyData };
  };

  const topData = processData(currentMost.mastery, currentMost.accuracy);
  const leastData = processData(currentLeast.mastery, currentLeast.accuracy);

  // Animation state to trigger smooth transitions
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    //When data comes, initially keep it to false, then after a small delay, set it to true, this causes the animation to trigger
    if (hasRealData) {
      // Reset animation first
      setShouldAnimate(false); //were only changing property, NOT DOM ELEMENTS
      // Then trigger animation after a small delay
      const timer = setTimeout(() => setShouldAnimate(true), 50);
      return () => clearTimeout(timer);
    }
  }, [hasRealData]);

  return (
    <div className="card-stat-light">
      <h3 className="text-white font-semibold text-lg mb-6">
        Topic Wise Performance
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Performance */}
        <TopicSection
          title="Strong Areas"
          icon="🏆"
          masteryData={topData.masteryData}
          accuracyData={topData.accuracyData}
          isGoodSection={true}
          shouldAnimate={shouldAnimate}
          hasRealData={hasRealData}
        />

        {/* Areas for Improvement */}
        <TopicSection
          title="Areas for Improvement"
          icon="🎯"
          masteryData={leastData.masteryData}
          accuracyData={leastData.accuracyData}
          isGoodSection={false}
          shouldAnimate={shouldAnimate}
          hasRealData={hasRealData}
        />
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-gray-400">Strong Mastery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-gray-400">High Accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span className="text-gray-400">Needs Mastery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
            <span className="text-gray-400">Needs Accuracy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
