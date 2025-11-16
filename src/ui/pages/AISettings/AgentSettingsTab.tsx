import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { Window } from "../../../../types/global-types";
import PageTitle from "../../components/PageTitle";
import useAgentSettingsStore from "../../stores/AgentSettingsStore";

function AgentSettingsTab() {
  // Local UI state only (no backend logic)
  // seconds to wait between dispatched actions
  const [waitBetweenActions, setWaitBetweenActions] = useState<number>(0.2);
  const [savedStatus, setSavedStatus] = useState<{
    status: "idle" | "saving" | "saved" | "error";
    message?: string;
  }>({ status: "idle" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Reset unsaved flag on mount
    // load persisted values into local state
    (async () => {
      try {
        const agent = await (
          window as unknown as Window
        ).electronAPI.getAgentSettings();
        if (agent && typeof agent.wait_between_actions === "number") {
          setWaitBetweenActions(agent.wait_between_actions);
          useAgentSettingsStore.getState().saveSettings({
            waitBetweenActions: agent.wait_between_actions,
          });
        } else {
          const store = useAgentSettingsStore.getState();
          setWaitBetweenActions(store.waitBetweenActions);
        }
      } catch (_err) {
        // If IPC fails, fallback to local store
        console.warn("IPC getAgentSettings failed:", _err);
        const store = useAgentSettingsStore.getState();
        setWaitBetweenActions(store.waitBetweenActions);
      }
      setHasUnsavedChanges(false);
    })();
  }, []);

  const handleSave = () => {
    setSavedStatus({ status: "saving" });
    // persist to zustand store
    useAgentSettingsStore.getState().saveSettings({ waitBetweenActions });
    // persist to main process settings.json so Python and main can access it
    try {
      (window as unknown as Window).electronAPI.saveAgentSettings({
        wait_between_actions: waitBetweenActions,
      });
    } catch (err) {
      console.warn("Failed to save agent settings to main process:", err);
    }
    setTimeout(() => {
      setSavedStatus({
        status: "saved",
        message: "Agent Settings saved successfully",
      });
      setHasUnsavedChanges(false);
      setTimeout(() => setSavedStatus({ status: "idle" }), 2000);
    }, 400);
  };

  const handleReset = () => {
    // Reset to default value
    setWaitBetweenActions(0.2);
    setHasUnsavedChanges(false);
    setSavedStatus({ status: "idle" });
  };

  return (
    <div className="relative flex h-full w-full flex-col select-none">
      <PageTitle
        title="Agent Settings"
        savedStatus={savedStatus}
        hasUnsavedChanges={hasUnsavedChanges}
      >
        <button
          className="border px-3 py-1 text-sm text-white transition-colors hover:bg-white/10"
          onClick={handleReset}
          disabled={!hasUnsavedChanges}
        >
          Reset
        </button>
        <button
          className="flex items-center gap-2 bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600"
          onClick={handleSave}
          disabled={!hasUnsavedChanges || savedStatus.status === "saving"}
        >
          {savedStatus.status === "saving" ? (
            "Saving..."
          ) : (
            <>
              <Save size={14} />
              <span>Save</span>
            </>
          )}
        </button>
        <span className="text-sm text-white/70">
          Configure agent runtime limits
        </span>
      </PageTitle>

      <div className="max-h-full flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-medium text-white">Agent Settings</span>
          <span className="text-sm text-white/50">
            Only a single runtime option is exposed here
          </span>
        </div>

        <div className="flex gap-3">
          {/* Left Column - Option Control */}
          <div className="w-full">
            <div className="p-4">
              <div className="flex flex-col space-y-3">
                <div className="mt-3">
                  <label className="block text-sm text-white/70">
                    Wait Between Actions (seconds)
                  </label>
                  <p className="mt-1 text-xs text-white/50">
                    Minimum delay between agent actions. See docs for details.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      className="w-40 appearance-none rounded-none border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 ring-0 select-text focus:border-blue-500/50 focus:ring-0 focus:outline-none"
                      value={waitBetweenActions}
                      onChange={(e) => {
                        setWaitBetweenActions(Number(e.target.value));
                        setHasUnsavedChanges(true);
                      }}
                    />
                    <span className="text-xs text-white/50">
                      Current: {waitBetweenActions}s
                    </span>
                  </div>
                </div>

                {/* settings only - no extra group text */}
              </div>
            </div>
          </div>

          {/* Right Column - Placeholder */}
          <div className="w-full">
            <div className="p-4">
              <h3 className="mb-3 text-sm font-medium text-white">
                Additional Settings
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-white/50">
                  Additional agent configuration will appear here in future.
                </p>
                <div className="flex h-32 items-center justify-center border border-dashed border-white/20">
                  <span className="text-sm text-white/40">
                    Future content area
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentSettingsTab;
