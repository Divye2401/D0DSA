import ProgressBar from "../ProgressBar";

export default function TopicSection({
  title,
  icon,
  masteryData,
  accuracyData,
  isGoodSection,
  shouldAnimate,
  hasRealData,
}) {
  const getPerformanceColor = (value, type, isGoodSection) => {
    if (isGoodSection) {
      // Good performance - green tones
      if (type === "mastery") {
        return "from-green-500 to-green-400";
      } else {
        return "from-blue-500 to-blue-400";
      }
    } else {
      // Poor performance - red/orange tones
      if (type === "mastery") {
        return "from-red-500 to-red-400";
      } else {
        return "from-orange-500 to-orange-400";
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 ">
        <span className="text-lg">{icon}</span>
        <h4 className="text-white font-medium text-base">{title}</h4>
      </div>

      {/* Mastery Topics */}
      {masteryData && masteryData.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-white text-sm font-medium">Topic Mastery</h5>
          {masteryData.map((topic, index) => (
            <div key={`mastery-${topic.name}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{topic.name}</span>
                <span className="text-white text-sm font-semibold">
                  {topic.value.toFixed(0)} problems
                </span>
              </div>
              <ProgressBar
                gradient={getPerformanceColor(
                  topic.value,
                  "mastery",
                  isGoodSection
                )}
                width={hasRealData && shouldAnimate ? topic.value : 1}
                delay={masteryData?.length || 0 + index}
              />
            </div>
          ))}
        </div>
      )}

      {/* Accuracy Topics */}
      {accuracyData && accuracyData.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-white text-sm font-medium mt-6">
            Topic Accuracy
          </h5>
          {accuracyData.map((topic, index) => (
            <div key={`accuracy-${topic.name}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{topic.name}</span>
                <span className="text-white text-sm font-semibold">
                  {topic.value.toFixed(0)}%
                </span>
              </div>
              <ProgressBar
                gradient={getPerformanceColor(
                  topic.value,
                  "accuracy",
                  isGoodSection
                )}
                width={hasRealData && shouldAnimate ? topic.value : 1}
                delay={accuracyData?.length || 0 + index}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
