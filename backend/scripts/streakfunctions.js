export function parseSubmissionCalendar(submissionCalendar) {
  if (!submissionCalendar) {
    return {};
  }

  try {
    return typeof submissionCalendar === "string"
      ? JSON.parse(submissionCalendar)
      : submissionCalendar;
  } catch (error) {
    console.error("Error parsing submission calendar:", error);
    return {};
  }
}

/**
 * Calculate streak data for last 7 days using parsed calendar
 */
export function calculateStreakData(parsedCalendar) {
  const last7Days = [];
  const today = new Date();

  // Generate last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    last7Days.push({
      date: dateStr,
      count: 0,
    });
  }

  // If no calendar data, return empty streak
  if (!parsedCalendar || Object.keys(parsedCalendar).length === 0) {
    return last7Days;
  }

  // LeetCode calendar format: { "timestamp": count, ... }
  // Convert timestamps to dates and match with our 7-day window
  Object.entries(parsedCalendar).forEach(([timestamp, count]) => {
    const date = new Date(parseInt(timestamp) * 1000); // LeetCode uses seconds
    const dateStr = date.toISOString().split("T")[0];

    const dayIndex = last7Days.findIndex((day) => day.date === dateStr);
    if (dayIndex !== -1) {
      last7Days[dayIndex].count = count;
    }
  });

  return last7Days;
}

/**
 * Calculate longest streak ever from parsed calendar
 */
export function calculateLongestStreak(parsedCalendar) {
  if (!parsedCalendar || Object.keys(parsedCalendar).length === 0) {
    return 0;
  }

  // Get all day numbers with submissions, sorted chronologically
  const submissionDays = Object.entries(parsedCalendar)
    .filter(([, count]) => count > 0) // Only days with submissions
    .map(([timestamp]) => Math.floor(parseInt(timestamp) / (60 * 60 * 24))) // Convert to day numbers
    .sort((a, b) => a - b);

  if (submissionDays.length === 0) {
    return 0;
  }

  let longestStreak = 1;
  let currentStreak = 1;

  // Compare consecutive day numbers to find longest streak
  for (let i = 1; i < submissionDays.length; i++) {
    const prevDay = submissionDays[i - 1];
    const currDay = submissionDays[i];

    // Check if day numbers are consecutive (difference of 1)
    if (currDay - prevDay === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1; // Reset streak
    }
  }

  return longestStreak;
}

/**
 * Calculate average daily submissions since first submission
 */
export function calculateAverageDaily(parsedCalendar) {
  if (!parsedCalendar || Object.keys(parsedCalendar).length === 0) {
    return 0;
  }

  const timestamps = Object.keys(parsedCalendar).map((ts) => parseInt(ts));

  if (timestamps.length === 0) {
    return 0;
  }

  // Count actual active days (days with submissions > 0)
  const activeDays = Object.values(parsedCalendar).filter(
    (count) => count > 0
  ).length;

  if (activeDays === 0) {
    return 0;
  }

  // Calculate total submissions
  const totalSubmissions = Object.values(parsedCalendar).reduce(
    (sum, count) => sum + count,
    0
  );

  // Return average rounded to 1 decimal place
  return Math.round((totalSubmissions / activeDays) * 10) / 10;
}

/**
 * Find best day of the week based on submission frequency
 */
export function calculateBestDayOfWeek(parsedCalendar) {
  if (!parsedCalendar || Object.keys(parsedCalendar).length === 0) {
    return "Monday"; // Default fallback
  }

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayCounts = new Array(7).fill(0);

  // Count submissions by day of week
  Object.entries(parsedCalendar).forEach(([timestamp, count]) => {
    if (count > 0) {
      const date = new Date(parseInt(timestamp) * 1000);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      dayCounts[dayOfWeek] += count;
    }
  });

  // Find day with highest count
  const bestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  return dayNames[bestDayIndex];
}
