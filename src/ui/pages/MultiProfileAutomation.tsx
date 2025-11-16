import { Link, Outlet, useLocation } from "react-router";
import { useAutomationStore } from "../stores/AutomationStore";

function MultiProfileAutomationPage() {
  const location = useLocation();

  return (
    <div className="relative flex h-full w-full flex-col select-none">
      {/* Tab Navigation - Minimal design like AI Settings */}
      <div className="border-b border-white/10 bg-black/10">
        <div className="flex px-6">
          <Link
            to="/multi-profile/tasks"
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              location.pathname === "/multi-profile/tasks" ||
              location.pathname === "/multi-profile"
                ? "border-b-2 border-blue-500 text-white"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            Tasks
          </Link>
          <Link
            to="/multi-profile/scheduled"
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              location.pathname === "/multi-profile/scheduled"
                ? "border-b-2 border-blue-500 text-white"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            Scheduled ({useAutomationStore((s) => s.getScheduledTasks().length)}
            )
          </Link>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default MultiProfileAutomationPage;
