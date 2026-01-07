import { Loader, Play, Square } from "lucide-react";
import { useState } from "react";
import type { Window } from "../../../types/global-types";
import PageTitle from "../components/PageTitle";
import { useAISettingsStore } from "../stores/AISettingsStore";

const EkoDemoPage = () => {
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const { activeProvider, configs } = useAISettingsStore();
  const activeModel = configs[activeProvider];

  const handleRunAutomation = async () => {
    if (!prompt.trim() || isRunning) return;

    // Validate AI settings
    if (!activeModel || !activeModel.apiKey) {
      setLogs([
        "ERROR: No AI model configured. Please set up your AI model in AI Settings.",
      ]);
      return;
    }

    const taskId = `eko-${Date.now()}`;
    setCurrentTaskId(taskId);
    setIsRunning(true);
    setLogs([]);

    try {
      setLogs((prev) => [
        ...prev,
        `[INIT] Starting Eko automation task: ${taskId}`,
      ]);
      setLogs((prev) => [...prev, `[INIT] Prompt: ${prompt.trim()}`]);
      setLogs((prev) => [
        ...prev,
        `[INIT] Using model: ${activeModel.provider} - ${activeModel.model}`,
      ]);

      const response = await (
        window as unknown as Window
      ).electronAPI.runEkoAutomation({
        taskId,
        prompt: prompt.trim(),
        modelConfig: activeModel,
      });

      // Add returned logs
      if (response.logs && response.logs.length > 0) {
        setLogs((prev) => [...prev, ...(response.logs || [])]);
      }

      if (response.success) {
        setLogs((prev) => [
          ...prev,
          `[SUCCESS] Automation completed successfully`,
        ]);
        if (response.result) {
          setLogs((prev) => [
            ...prev,
            `[RESULT] ${JSON.stringify(response.result, null, 2)}`,
          ]);
        }
      } else {
        setLogs((prev) => [...prev, `[ERROR] ${response.message}`]);
        if (response.error) {
          setLogs((prev) => [...prev, `[ERROR] ${response.error}`]);
        }
      }
    } catch (error: any) {
      setLogs((prev) => [
        ...prev,
        `[ERROR] Exception occurred: ${error.message}`,
      ]);
      console.error("Eko automation error:", error);
    } finally {
      setIsRunning(false);
      setCurrentTaskId(null);
    }
  };

  const handleStopAutomation = async () => {
    if (!currentTaskId) return;

    try {
      const response = await (
        window as unknown as Window
      ).electronAPI.stopEkoAutomation(currentTaskId);
      setLogs((prev) => [...prev, `[STOP] ${response.message}`]);
      setIsRunning(false);
      setCurrentTaskId(null);
    } catch (error: any) {
      setLogs((prev) => [
        ...prev,
        `[ERROR] Failed to stop automation: ${error.message}`,
      ]);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] p-4">
      <PageTitle title="Eko Automation Demo" />

      <div className="mt-4 flex flex-1 flex-col gap-3">
        {/* AI Model Info */}
        <div className="border border-white/10 bg-black/40 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/50">Active AI Model</div>
              <div className="text-sm text-white">
                {activeModel
                  ? `${activeModel.provider} - ${activeModel.model}`
                  : "No model configured"}
              </div>
            </div>
            {!activeModel?.apiKey && (
              <div className="text-xs text-red-400">
                ⚠️ Configure API key in AI Settings
              </div>
            )}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/70">Automation Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter natural language automation command (e.g., 'Open google.com and search for AI news')"
            className="h-24 w-full resize-none border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            disabled={isRunning}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={handleRunAutomation}
              disabled={!prompt.trim() || !activeModel?.apiKey}
              className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:opacity-50"
            >
              <Play size={16} />
              Run Automation
            </button>
          ) : (
            <button
              onClick={handleStopAutomation}
              className="flex items-center gap-2 bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
            >
              <Square size={16} />
              Stop
            </button>
          )}

          <button
            onClick={handleClearLogs}
            disabled={isRunning}
            className="bg-gray-700 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Logs
          </button>
        </div>

        {/* Logs Display */}
        <div className="flex flex-1 flex-col border border-white/20 bg-black/60">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-3 py-2">
            <h3 className="text-xs font-semibold text-white">Output Logs</h3>
            {isRunning && (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <Loader size={14} className="animate-spin" />
                Running...
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {logs.length > 0 ? (
              <div className="space-y-1 font-mono text-xs text-gray-300">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`${
                      log.includes("[ERROR]")
                        ? "text-red-400"
                        : log.includes("[SUCCESS]")
                          ? "text-green-400"
                          : log.includes("[INIT]")
                            ? "text-blue-400"
                            : log.includes("[RESULT]")
                              ? "text-yellow-400"
                              : "text-gray-300"
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/30">
                No output yet. Enter a prompt and click "Run Automation" to
                start.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EkoDemoPage;
