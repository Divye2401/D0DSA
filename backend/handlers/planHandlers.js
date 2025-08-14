import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
//---------------------------------------------------------------------------
// Get user's leetcode stats for personalization
const getUserStats = async (userId, weakTopics) => {
  try {
    const { data } = await supabase
      .from("leetcode_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    let topicPriorities = [];

    // Get topic-wise mastery and accuracy from the data
    const topicMastery = data.topic_mastery || {};
    const topicAccuracy = data.topic_accuracy || {};

    if (weakTopics && weakTopics.length > 0) {
      // Use specified weak topics
      topicPriorities = weakTopics
        .map((topicName) => {
          const mastery = topicMastery[topicName] || 0;
          const accuracy = topicAccuracy[topicName] || 0;
          const priority =
            accuracy < 50 ? "High" : accuracy < 80 ? "Medium" : "Low";

          return {
            topic: topicName,
            mastery: mastery,
            accuracy: accuracy,
            priority,
          };
        })
        .sort((a, b) => a.accuracy - b.accuracy); // Weakest first
    } else {
      // No weak topics specified - analyze ALL topics and find weakest ones
      const allTopics = Object.keys(topicAccuracy);

      topicPriorities = allTopics
        .map((topicName) => {
          const mastery = topicMastery[topicName] || 0;
          const accuracy = topicAccuracy[topicName] || 0;
          const priority =
            accuracy < 50 ? "High" : accuracy < 80 ? "Medium" : "Low";

          return {
            topic: topicName,
            mastery: mastery,
            accuracy: accuracy,
            priority,
          };
        })
        .sort((a, b) => a.accuracy - b.accuracy) // Weakest first
        .slice(0, 5); // Take top 5 weakest topics
    }

    return { topicPriorities, data };
  } catch (error) {
    console.error("Error getting topic mastery:", error);
    return [];
  }
};

//---------------------------------------------------------------------------

// Generate personalized study plan
export const generateStudyPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { company, days, weakTopics, timePerDay } = req.body;

    console.log(`Generating ${days}-day plan for user: ${userId}`);
    console.log(
      `Settings: ${company}, ${timePerDay}h/day, topics: ${weakTopics.join(
        ", "
      )}`
    );

    // Get user's leetcode stats for personalization
    const result = await getUserStats(userId, weakTopics);
    const topicPriorities = result?.topicPriorities || [];
    const userStats = result?.data;

    const noOfProblems =
      timePerDay < 3 ? 2 : timePerDay >= 3 && timePerDay <= 5 ? 3 : 5;

    // Do all conditional logic and personalization first
    let difficultyFocus = "Mixed"; // Default
    let startingDifficulty = "Easy";

    if (userStats) {
      const totalSolved = userStats.total_solved || 0;
      const easySolved = userStats.easy_solved || 0;
      const mediumSolved = userStats.medium_solved || 0;

      // Determine difficulty focus based on user's progress
      if (totalSolved < 50 || easySolved < 30) {
        difficultyFocus = "Easy";
        startingDifficulty = "Easy";
      } else if (mediumSolved < 20) {
        difficultyFocus = "Easy to Medium";
        startingDifficulty = "Easy";
      } else {
        difficultyFocus = "Medium to Hard";
        startingDifficulty = "Medium";
      }
    }

    // Create direct prompt with calculated values
    const topicFocus =
      topicPriorities.length > 0
        ? topicPriorities.map((t) => t.topic).join(", ")
        : weakTopics.join(", ");

    const prompt = `
Generate a ${days}-day DSA preparation plan for a ${company} interview.

REQUIREMENTS:
- ${timePerDay} hours of study per day (max)
- ${noOfProblems} problems per day
- Start with ${startingDifficulty} difficulty problems
- Overall difficulty focus: ${difficultyFocus}
- Priority topics (Weakest to Strongest): ${topicFocus || "General DSA"}
- Target company: ${company === "all" ? "All companies" : company}
- Theory should be based on the problems given for that day



For each day, provide:
1. specific LeetCode problem slugs (with difficulty), 
2. Theory topic to study (give a 3-4 step pathway to the topic)
3. Suggestions and Pitfalls (Give a list of suggestions and pitfalls that happen with ur suggestion)


Return ONLY a JSON array in this format:
[
  {
    "day": 1,
    "problems": [""],
    "theory": "Topic and the reason u chose it",
    "suggestions": "Easy Array Problems",
    "pitfalls": "Common Mistakes",
    "estimatedTime": ""
  }
]

Make it progressive (easy to hard) and relevant to ${company} interview patterns.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let studyPlan;
    try {
      const aiResponse = completion.choices[0].message.content;
      // Clean response (remove markdown if present)
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, "").trim();
      studyPlan = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return res.status(500).json({ error: "Failed to generate study plan" });
    }

    console.log(`Generated ${studyPlan.length}-day plan`);

    // Store plan in database
    try {
      // First, deactivate any existing active plans for this user
      await supabase
        .from("daily_plans")
        .update({ is_active: false })
        .eq("user_id", userId);

      // Insert the new plan
      const { data: savedPlan, error: saveError } = await supabase
        .from("daily_plans")
        .insert({
          user_id: userId,
          plan_data: studyPlan,
          target_company: company,
          prep_days: days,
          hours_per_day: timePerDay,
          weak_topics: weakTopics,
          is_active: true,
        })
        .select()
        .single();

      if (saveError) {
        console.error("Error saving plan:", saveError);
        // Don't fail the request, just log the error
      } else {
        console.log(`Plan saved with ID: ${savedPlan.id}`);

        // Add dates to plan and create tasks
        const today = new Date();
        const planWithDates = studyPlan.map((dayPlan, index) => {
          const currentDate = new Date(today);
          currentDate.setDate(today.getDate() + index);
          const dateString = currentDate.toISOString().split("T")[0];

          return {
            ...dayPlan,
            date: dateString,
          };
        });

        // Create tasks for the new plan
        try {
          for (const dayPlan of planWithDates) {
            // Create progress entries for problems
            for (const problem of dayPlan.problems) {
              await supabase.from("task_progress").insert({
                user_id: userId,
                plan_id: savedPlan.id,
                task_type: "problem",
                task_description: problem,
                date: dayPlan.date,
                completed: false,
              });
            }

            // Create progress entry for theory
            if (dayPlan.theory) {
              await supabase.from("task_progress").insert({
                user_id: userId,
                plan_id: savedPlan.id,
                task_type: "theory",
                task_description: dayPlan.theory,
                date: dayPlan.date,
                completed: false,
              });
            }
          }

          console.log(`Created tasks for plan: ${savedPlan.id}`);

          // Enhance plan with task objects
          const enhancedPlan = await getTasksForPlan(
            userId,
            savedPlan.id,
            planWithDates
          );

          return res.json({
            success: true,
            planDuration: `${enhancedPlan.length}`,
            plan: enhancedPlan,
            settings: {
              company,
              days,
              weakTopics,
              timePerDay,
            },
          });
        } catch (taskError) {
          console.error("Error creating tasks:", taskError);
          // Fall back to basic plan response
        }
      }
    } catch (dbError) {
      console.error("Database error while saving plan:", dbError);
      // Continue without failing the request
    }

    // Fallback response (if plan saving failed or task creation failed)
    res.json({
      success: true,
      planDuration: `${studyPlan.length}`,
      plan: studyPlan,
      settings: {
        company,
        days,
        weakTopics,
        timePerDay,
      },
    });
  } catch (error) {
    console.error("Generate plan error:", error);
    res.status(500).json({ error: "Failed to generate study plan" });
  }
};

//---------------------------------------------------------------------------
// Modify existing plan based on user feedback
export const updateActivePlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { modificationRequest } = req.body;

    if (!modificationRequest) {
      return res
        .status(400)
        .json({ error: "No modification request provided" });
    }

    console.log("modificationRequest", modificationRequest);

    const { data, error } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching current plan:", error);
      return res.status(500).json({ error: "Failed to fetch current plan" });
    }

    if (!data) {
      return res.json({
        success: true,
        message: "No active study plan found",
        plan: null,
      });
    }

    const currentPlan = data.plan_data;
    const planId = data.id;
    console.log(`Modifying plan for user: ${userId}`);
    console.log(`Request: ${modificationRequest}`);

    const prompt = `
Modify this existing study plan based on the user's request.

Current Plan:
${JSON.stringify(currentPlan, null, 2)}

User's Request:
"${modificationRequest}"

Return the modified plan in the same JSON format. Keep the same structure but adjust based on the user's feedback.
Make reasonable changes that align with their request while maintaining a logical progression.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let modifiedPlan;
    try {
      const aiResponse = completion.choices[0].message.content;
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, "").trim();
      modifiedPlan = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return res.status(500).json({ error: "Failed to modify study plan" });
    }

    console.log(`Modified plan with ${modifiedPlan.length} days`);

    // Store modified plan as a new plan (same as generateStudyPlan)
    try {
      // First, deactivate any existing active plans for this user
      await supabase
        .from("daily_plans")
        .update({ is_active: false })
        .eq("user_id", userId);

      // Insert the modified plan as a new plan
      const { data: savedPlan, error: saveError } = await supabase
        .from("daily_plans")
        .insert({
          user_id: userId,
          plan_data: modifiedPlan,
          target_company: data.target_company,
          prep_days: data.prep_days,
          hours_per_day: data.hours_per_day,
          weak_topics: data.weak_topics,
          is_active: true,
        })
        .select()
        .single();

      if (saveError) {
        console.error("Error saving modified plan:", saveError);
        return res
          .status(500)
          .json({ error: "Failed to save modified study plan" });
      } else {
        console.log(`Modified plan saved with new ID: ${savedPlan.id}`);
      }
    } catch (dbError) {
      console.error("Database error while saving modified plan:", dbError);
      return res
        .status(500)
        .json({ error: "Failed to save modified study plan" });
    }

    res.json({
      success: true,
      message: "Study plan modified successfully",
      plan: modifiedPlan,
    });
  } catch (error) {
    console.error("Modify plan error:", error);
    res.status(500).json({ error: "Failed to modify study plan" });
  }
};

//---------------------------------------------------------------------------
// Get user's active study plan
export const getActivePlan = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`Fetching active plan for user: ${userId}`);

    const { data: activePlan, error } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to fetch study plan" });
    }

    if (!activePlan) {
      return res.json({
        success: true,
        message: "No active study plan found",
        plan: null,
      });
    }

    console.log(`Found active plan: ${activePlan.id}`);

    // Transform plan data to include actual dates instead of day numbers
    const planWithDates = activePlan.plan_data.map((dayPlan, index) => {
      const currentDate = new Date(activePlan.created_at);
      currentDate.setDate(currentDate.getDate() + index);

      return {
        ...dayPlan,
        date: currentDate.toISOString().split("T")[0], // YYYY-MM-DD format
        day: dayPlan.day, // Keep original day number as well
      };
    });

    // Create task progress entries for this plan if they don't exist
    try {
      for (const dayPlan of planWithDates) {
        // Create progress entries for problems
        for (const problem of dayPlan.problems) {
          const { error: insertError } = await supabase
            .from("task_progress")
            .insert({
              user_id: userId,
              plan_id: activePlan.id,
              task_type: "problem",
              task_description: problem,
              date: dayPlan.date,
              completed: false,
            });

          // Ignore unique constraint violations (task already exists)
          if (insertError && !insertError.message.includes("duplicate key")) {
            console.error("Error creating problem progress:", insertError);
          }
        }

        // Create progress entry for theory
        const { error: theoryError } = await supabase
          .from("task_progress")
          .insert({
            user_id: userId,
            plan_id: activePlan.id,
            task_type: "theory",
            task_description: dayPlan.theory,
            date: dayPlan.date,
            completed: false,
          });

        // Ignore unique constraint violations (task already exists)
        if (theoryError && !theoryError.message.includes("duplicate key")) {
          console.error("Error creating theory progress:", theoryError);
        }
      }

      console.log(`Created task progress entries for plan: ${activePlan.id}`);
    } catch (progressError) {
      console.error("Error creating task progress:", progressError);
      // Don't fail the request, just log the error
    }

    // Enhance plan with task objects
    const enhancedPlan = await getTasksForPlan(
      userId,
      activePlan.id,
      planWithDates
    );

    res.json({
      success: true,
      message: "Active study plan retrieved",
      plan: enhancedPlan,
      settings: {
        company: activePlan.target_company,
        days: activePlan.prep_days,
        weakTopics: activePlan.weak_topics,
        timePerDay: activePlan.hours_per_day,
      },
      createdAt: activePlan.created_at,
    });
  } catch (error) {
    console.error("Get active plan error:", error);
    res.status(500).json({ error: "Failed to fetch study plan" });
  }
};

//---------------------------------------------------------------------------
// Helper function to fetch tasks for a plan and enhance it with task objects
const getTasksForPlan = async (userId, planId, planData) => {
  try {
    // Fetch all tasks for this plan
    const { data: allTasks, error } = await supabase
      .from("task_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      return planData; // Return original plan if task fetch fails
    }

    // Group tasks by date and type
    const tasksByDate = {};
    allTasks.forEach((task) => {
      if (!tasksByDate[task.date]) {
        tasksByDate[task.date] = { problems: [], theory: [] };
      }
      if (task.task_type === "problem") {
        tasksByDate[task.date].problems.push(task);
      } else if (task.task_type === "theory") {
        tasksByDate[task.date].theory.push(task);
      }
    });

    // Enhance plan with task objects
    const enhancedPlan = planData.map((dayPlan) => ({
      ...dayPlan,
      problemTasks: tasksByDate[dayPlan.date]?.problems || [],
      theoryTasks: tasksByDate[dayPlan.date]?.theory || [],
    }));

    return enhancedPlan;
  } catch (error) {
    console.error("Error enhancing plan with tasks:", error);
    return planData; // Return original plan if enhancement fails
  }
};
//---------------------------------------------------------------------------
// Get today's tasks for a user
export const getTodaysTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    console.log(`Fetching today's tasks for user: ${userId}, date: ${today}`);

    // Get today's task progress for the active plan
    const { data: tasks, error } = await supabase
      .from("task_progress")
      .select(
        `
        *,
        daily_plans!inner(is_active)
      `
      )
      .eq("user_id", userId)
      .eq("date", today)
      .eq("daily_plans.is_active", true);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to fetch today's tasks" });
    }

    if (!tasks || tasks.length === 0) {
      return res.json({
        success: true,
        message: "No tasks found for today",
        tasks: [],
        date: today,
      });
    }

    // Separate problems and theory
    const problems = tasks.filter((task) => task.task_type === "problem");
    const theory = tasks.filter((task) => task.task_type === "theory");

    console.log(
      `Found ${tasks.length} tasks for today (${problems.length} problems, ${theory.length} theory)`
    );

    res.json({
      success: true,
      message: "Today's tasks retrieved successfully",
      tasks: tasks,
      problems: problems,
      theory: theory,
      date: today,
      stats: {
        total: tasks.length,
        completed: tasks.filter((task) => task.completed).length,
        problems: problems.length,
        theory: theory.length,
      },
    });
  } catch (error) {
    console.error("Get today's tasks error:", error);
    res.status(500).json({ error: "Failed to fetch today's tasks" });
  }
};

//---------------------------------------------------------------------------
// Toggle task completion status
export const toggleTaskCompletion = async (req, res) => {
  try {
    const { userId } = req.params;
    const { taskId, completed } = req.body;

    console.log(`Toggling task ${taskId} to ${completed} for user: ${userId}`);

    // Update task completion status
    const { error } = await supabase
      .from("task_progress")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("user_id", userId);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Failed to update task" });
    }

    res.json({
      success: true,
      message: `Task ${completed ? "completed" : "marked incomplete"}`,
    });
  } catch (error) {
    console.error("Toggle task completion error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};
