import { Pause, Play, Trash2 } from "lucide-react";
import PageTitle from "../../components/PageTitle";
import {
  useAutomationStore,
  type ScheduledTask,
} from "../../stores/AutomationStore";

function MultiProfileAutomationScheduled() {
  const {
    getScheduledTasks,
    toggleScheduledTask,
    deleteScheduledTask,
    stopAllScheduledTasks,
  } = useAutomationStore();

  const formatDateTime = (date: Date | null) => {
    if (!date) return "Not set";
    return date.toLocaleString();
  };

  const formatInterval = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="relative flex h-full w-full flex-col select-none">
      <PageTitle title="Scheduled Tasks" />

      <div className="max-h-[calc(100vh-140px)] flex-1 overflow-auto p-4">
        <div className="border border-blue-500/20 bg-blue-500/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-blue-200">
              Scheduled Tasks
            </h3>
            {getScheduledTasks().some((task) => task.isActive) && (
              <button
                onClick={stopAllScheduledTasks}
                className="text-xs text-blue-300 hover:text-blue-100"
              >
                Stop All Schedules
              </button>
            )}
          </div>

          {getScheduledTasks().length === 0 ? (
            <p className="text-center text-sm text-blue-200/60">
              No scheduled tasks yet. Use the "Schedule" button in the Tasks tab
              to create one.
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {getScheduledTasks().map((task: ScheduledTask) => (
                <div
                  key={task.id}
                  className="border border-blue-400/20 bg-black/20 p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-blue-200">
                        {task.name}
                      </div>
                      <div className="mt-1 text-xs text-blue-300/80">
                        {task.prompt}
                      </div>
                      <div className="text-xs text-blue-300/80">
                        {task.profiles.length} profile(s) • Every{" "}
                        {formatInterval(task.intervalMinutes)}
                      </div>
                      <div className="text-xs text-blue-300/60">
                        Start: {formatDateTime(new Date(task.startTime))} • End:{" "}
                        {formatDateTime(new Date(task.endTime))}
                      </div>
                      <div className="text-xs text-blue-300/60">
                        {task.isActive ? (
                          <span className="text-green-400">
                            Active • Next:{" "}
                            {formatDateTime(task.nextExecutionAt)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Inactive</span>
                        )}
                        {task.executionCount !== undefined && (
                          <span className="ml-2">
                            • Runs: {task.executionCount} /{" "}
                            {task.maxExecutions || "∞"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleScheduledTask(task.id)}
                        className={`px-2 py-1 text-xs ${
                          task.isActive
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {task.isActive ? (
                          <Pause size={12} />
                        ) : (
                          <Play size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteScheduledTask(task.id)}
                        className="bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MultiProfileAutomationScheduled;
