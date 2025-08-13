import { useQueryClient } from "@tanstack/react-query";
import { toggleTaskCompletion } from "../../utils/planAPI";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

export default function TodaysPlan({ planData }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const handleTaskToggle = async (taskId, currentCompleted) => {
    const newCompleted = !currentCompleted;

    // Update cache immediately (optimistic)
    queryClient.setQueryData(["dashboardTasks", user.id], (old) => ({
      ...old,
      tasks:
        old?.tasks?.map((task) =>
          task.id === taskId ? { ...task, completed: newCompleted } : task
        ) || [],
    }));

    try {
      // Send to backend
      await toggleTaskCompletion(user.id, taskId, newCompleted);
      toast.success(
        newCompleted ? "Task completed! 🎉" : "Task marked incomplete"
      );
      queryClient.invalidateQueries({
        queryKey: ["dashboardTasks", user.id],
      });
    } catch (error) {
      // Revert cache on error
      queryClient.setQueryData(["dashboardTasks", user.id], (old) => ({
        ...old,
        tasks:
          old?.tasks?.map((task) =>
            task.id === taskId ? { ...task, completed: currentCompleted } : task
          ) || [],
      }));
      toast.error("Failed to update task");
      console.error("Error toggling task:", error);
    }
  };

  if (!planData || planData.length === 0) {
    return (
      <div className="card-stat-light">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg">📋 Today's Plan</h3>
          <span className="text-gray-400 text-xs">No tasks</span>
        </div>
        <div className="text-center py-8">
          <span className="text-4xl mb-2 block">📅</span>
          <p className="text-gray-400 text-sm">No tasks available for today</p>
          <p className="text-gray-500 text-xs mt-1">
            Generate a plan to get started!
          </p>
        </div>
      </div>
    );
  }

  // Use planData directly - React Query cache handles updates
  const tasks = planData.map((task) => ({
    id: task.id,
    icon: task.task_type === "problem" ? "💡" : "📚",
    iconColor:
      task.task_type === "problem" ? "text-orange-400" : "text-blue-400",
    description:
      task.task_type === "theory"
        ? `Study: ${task.task_description}`
        : task.task_description,
    type: task.task_type,
    completed: task.completed,
  }));

  // Calculate completion stats
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="card-stat-light">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-lg">📋 Today's Plan</h3>
        <span className="text-gray-400 text-xs">
          {completedTasks}/{totalTasks} completed
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div
            key={task.id || index}
            onClick={() => handleTaskToggle(task.id, task.completed)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-700/30 bg-gray-800/30 cursor-pointer ${
              task.completed ? "opacity-60" : ""
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <span className={`text-lg ${task.iconColor}`}>{task.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  task.completed ? "line-through text-gray-500" : "text-white"
                }`}
              >
                {task.description}
              </p>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              {task.completed ? (
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
