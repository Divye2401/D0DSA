export default function ProgressBar({ gradient, width, delay }) {
  return (
    <div className="w-full bg-gray-700/50 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${gradient}`}
        style={{
          width: `${Math.max(width, 2)}%`,
          transitionDelay: `${delay * 50}ms`,
        }}
      />
    </div>
  );
}
