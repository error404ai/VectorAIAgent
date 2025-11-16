import { OctagonPause } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import type { Window } from "../../../types/global-types";
import SideMenu from "../components/SideMenu";
import { useAutomationStore } from "../stores/AutomationStore";
import desktopIcon from "./../../../desktopIcon.png"; // Adjust the path as necessary

const MainLayout = () => {
  const location = useLocation();
  const {
    stopAllTasks,
    hasAnyRunningOrQueuedTasks,
    clearScheduledStarts,
    restoreScheduledTaskTimers,
  } = useAutomationStore();
  const [isClosing, setIsClosing] = useState(false);

  // Restore scheduled task timers on app startup
  useEffect(() => {
    console.log("Restoring scheduled task timers on app startup...");
    restoreScheduledTaskTimers();
  }, [restoreScheduledTaskTimers]); // Include the dependency

  // Check if we're on the automation page
  const isAutomationPage = location.pathname === "/";

  // Check if any tasks are running or queued across all profiles
  const hasTasksRunningOrQueued = hasAnyRunningOrQueuedTasks();

  // Window control handlers
  const handleMinimize = () => {
    if ((window as unknown as Window).electronAPI) {
      (window as unknown as Window).electronAPI.minimizeWindow();
    }
  };

  const handleClose = async () => {
    if ((window as unknown as Window).electronAPI) {
      // Check if there are any running tasks and stop them first
      if (hasTasksRunningOrQueued) {
        setIsClosing(true);
        console.log("Stopping all running and queued tasks before closing...");
        try {
          await stopAllTasks();
          clearScheduledStarts(); // Also clear any queued tasks
          await new Promise((resolve) => setTimeout(resolve, 10000));
        } catch (error) {
          console.error("Error stopping tasks:", error);
        } finally {
          setIsClosing(false);
        }
      }
      (window as unknown as Window).electronAPI.closeWindow();
    }
  };

  // Use the stopAllTasks function from the store to stop all running tasks and clear queued ones
  const handleStopAutomation = async () => {
    await stopAllTasks();
    clearScheduledStarts(); // Also clear any queued tasks
  };

  return (
    <div className="fixed inset-0 flex h-full flex-col overflow-hidden">
      <div className="min-h-[40px] bg-[#091E38]">
        <div className="flex h-full items-center justify-between bg-radial-[25.40%_150.55%_at_50.0%_-0.29%] from-[#0B69C6]/50 to-[#0A1E38] text-sm text-white">
          {" "}
          <div className="flex h-full w-full items-center gap-3 px-2 [app-region:drag]">
            <img src={desktopIcon} alt="Logo" className="h-6 w-6" />
            <span className="font-medium">Vector AI Agent</span>
          </div>
          <div className="flex h-full items-center">
            {hasTasksRunningOrQueued && !isAutomationPage && (
              <button
                onClick={handleStopAutomation}
                className="flex h-full items-center gap-1 bg-red-600/80 px-4 text-xs font-medium text-white transition-colors hover:bg-red-600"
                title="Stop all running and queued automation tasks"
              >
                <OctagonPause size={14} />
              </button>
            )}
            <button
              onClick={handleMinimize}
              className="h-full px-4 transition-colors hover:bg-[#0A2E55]"
              title="Minimize"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M14 8a1 1 0 0 1-1 1H3a1 1 0 0 1 0-2h10a1 1 0 0 1 1 1z" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              disabled={isClosing}
              className="h-full px-4 transition-colors hover:bg-red-600"
              title={isClosing ? "Stopping tasks before closing..." : "Close"}
            >
              {isClosing ? (
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 animate-spin rounded-full border border-transparent border-t-white"></div>
                </div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  className="size-5"
                >
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="grid h-full grid-cols-8 bg-[#091E38] text-white">
        <div className="col-span-1">
          <SideMenu />
        </div>
        <div className="smooth-scroll col-span-7 h-[calc(100vh-40px)] overflow-y-auto bg-radial-[57.40%_200.55%_at_50.76%_-10.29%] from-[#0B69C6]/50 to-[#0A1E38]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
