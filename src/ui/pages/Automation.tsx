import {
  Clock,
  Loader,
  Maximize2,
  OctagonPause,
  Star,
  Wand2,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type {
  AutomationResultData,
  AutomationRuntimeOptions,
  Window,
} from "../../../types/global-types";
import Modal from "../components/Modal";
import PageTitle from "../components/PageTitle";
import ProfileTab from "../components/ProfileTab";
import PromptSidebar from "../components/PromptSidebar";
import { useCreateAgentTaskMutation } from "../RTKService/agentTaskService";
import { useSearchAiRulesMutation } from "../RTKService/aiRuleService";
import { useEnhancePromptMutation } from "../RTKService/promptService";
import { useAISettingsStore } from "../stores/AISettingsStore";
import { useAutomationStore } from "../stores/AutomationStore";
import { useBrowserSettingsStore } from "../stores/BrowserSettingsStore";
import { useWalletStore } from "../stores/WalletStore";

interface ProfileAutomationPanelProps {
  profile: string;
}

const ProfileAutomationPanel: React.FC<ProfileAutomationPanelProps> = ({
  profile,
}) => {
  const {
    getProfileState,
    createTaskForProfile,
    addProfileLog,
    clearProfileLogs,
    stopProfileTask,
    canCreateTaskForProfile,
    setProfilePrompt,
    startProfileTask,
    updateProfileTask,
    setProfileAttachedRule,
    setProfileRuleError,
    clearProfileAttachedRule,
  } = useAutomationStore();

  // Get the active model configuration from the store
  const { activeProvider, configs, fileUploadDirectory } = useAISettingsStore();
  const modelConfig = configs[activeProvider];

  const { wallets, setWallets } = useWalletStore();

  // Mutation hook to save task data to the backend
  const [createAgentTask] = useCreateAgentTaskMutation();

  // Mutation hook to search AI rules
  const [searchAiRules, { isLoading: isSearchingRules }] =
    useSearchAiRulesMutation();

  // Mutation hook to enhance prompt
  const [enhancePrompt, { isLoading }] = useEnhancePromptMutation();

  const profileState = getProfileState(profile);
  const [localPrompt, setLocalPrompt] = useState(profileState.prompt);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync local prompt with store
  useEffect(() => {
    setLocalPrompt(profileState.prompt);
  }, [profileState.prompt]);

  useEffect(() => {
    let isMounted = true;

    const loadWallets = async () => {
      if (wallets.length > 0) {
        return;
      }

      try {
        const result = await (
          window as unknown as Window
        ).electronAPI.getWallets();

        if (isMounted && result.success && result.wallets) {
          setWallets(result.wallets);
        }
      } catch (error) {
        console.error("Failed to load wallets:", error);
      }
    };

    loadWallets();

    return () => {
      isMounted = false;
    };
  }, [wallets.length, setWallets]);

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
    setProfilePrompt(profile, value);
  };

  const handleEnhancePrompt = async () => {
    if (!localPrompt.trim()) {
      return;
    }

    try {
      const response = await enhancePrompt({ prompt: localPrompt }).unwrap();
      setLocalPrompt(response.enhancedPrompt);
      setProfilePrompt(profile, response.enhancedPrompt);
    } catch (error) {
      console.error("Enhance prompt error:", error);
    }
  };

  // Save automation task data to the backend API
  const saveAutomationData = async (
    prompt: string,
    automationData: AutomationResultData | null | undefined,
    logs: string[],
    fallbackSuccess?: boolean,
    fallbackMessage?: string,
  ) => {
    try {
      // Extract errors from logs if no automation data
      const extractedErrors = logs
        .filter((log) => log.startsWith("ERROR:"))
        .map((log) => log.replace("ERROR: ", ""));

      const taskPayload = {
        prompt: prompt,
        logs: logs.join("\n"),
        steps: automationData?.steps
          ? JSON.stringify(automationData.steps)
          : undefined,
        provider: automationData?.provider || modelConfig.provider,
        model: automationData?.model || modelConfig.model,
        success: automationData?.success ?? fallbackSuccess ?? false,
        message:
          automationData?.message ||
          automationData?.final_result ||
          fallbackMessage ||
          "Task completed",
        total_steps: automationData?.total_steps ?? 0,
        total_duration_seconds: automationData?.duration_seconds ?? 0,
        urls_visited: automationData?.urls_visited?.join(", "),
        errors:
          automationData?.errors?.join("\n") ||
          (extractedErrors.length > 0 ? extractedErrors.join("\n") : undefined),
      };

      const result = await createAgentTask(taskPayload).unwrap();
      console.log("Successfully saved automation task data:", result);
      addProfileLog(profile, "📊 Task data saved to backend");
    } catch (error) {
      console.error("Failed to save automation task data:", error);
      addProfileLog(
        profile,
        `⚠️ Failed to save task data: ${(error as Error).message || "Unknown error"}`,
      );
    }
  };

  const handleSubmit = async () => {
    const trimmedPrompt = localPrompt.trim();

    if (!trimmedPrompt) {
      addProfileLog(
        profile,
        "ERROR: Please enter a prompt before starting automation",
      );
      return;
    }

    const RULE_SIMILARITY_THRESHOLD = parseFloat(
      import.meta.env.VITE_RULE_SIMILARITY_THRESHOLD || "0.5",
    );

    clearProfileAttachedRule(profile);

    let enhancedPrompt = trimmedPrompt;
    try {
      addProfileLog(profile, "🔍 Searching for relevant AI rules...");

      const ruleResponse = await searchAiRules({
        prompt: trimmedPrompt,
        limit: 3,
      }).unwrap();

      if (ruleResponse.data && ruleResponse.data.length > 0) {
        const topRule = ruleResponse.data[0];

        if (
          topRule.similarity_score &&
          topRule.similarity_score >= RULE_SIMILARITY_THRESHOLD
        ) {
          setProfileAttachedRule(profile, topRule);
          addProfileLog(
            profile,
            `✅ Found matching rule: "${topRule.name}" (similarity: ${(topRule.similarity_score * 100).toFixed(1)}%)`,
          );
          addProfileLog(profile, `📋 Rule description: ${topRule.description}`);

          // Enhance the prompt with the rule
          enhancedPrompt = `${topRule.rule}\n\nOriginal task: ${trimmedPrompt}`;
          addProfileLog(profile, "🔗 Rule attached to automation prompt");
        } else {
          addProfileLog(
            profile,
            `⚠️ Found rule but similarity too low: ${(topRule.similarity_score || 0) * 100}% < ${RULE_SIMILARITY_THRESHOLD * 100}%`,
          );
          setProfileRuleError(
            profile,
            "No matching rule found with sufficient similarity",
          );
        }
      } else {
        addProfileLog(profile, "ℹ️ No matching rules found");
        setProfileRuleError(profile, "No rules found");
      }
    } catch (error) {
      console.error("Failed to retrieve AI rules:", error);
      const errorMessage = (error as Error).message || "Unknown error";
      addProfileLog(
        profile,
        `⚠️ Failed to retrieve AI rules: ${errorMessage}. Proceeding without rule.`,
      );
      setProfileRuleError(profile, errorMessage);
    }

    // Check if API key is required and present for the active provider
    const providersRequiringApiKey = [
      "openai",
      "anthropic",
      "google",
      "deepseek",
      "openrouter",
      "groq",
    ];
    if (
      providersRequiringApiKey.includes(modelConfig.provider) &&
      !modelConfig.apiKey?.trim()
    ) {
      addProfileLog(
        profile,
        `ERROR: API key is required for ${modelConfig.provider}. Please configure your API key in AI Settings.`,
      );
      return;
    }

    if (!canCreateTaskForProfile(profile)) {
      addProfileLog(
        profile,
        "ERROR: A task is already running for this profile. Please wait for it to complete or stop it first.",
      );
      return;
    }

    try {
      const taskId = createTaskForProfile(profile, trimmedPrompt);
      if (!taskId) {
        addProfileLog(
          profile,
          "ERROR: Failed to create automation task - profile may already have a running task",
        );
        return;
      }

      // Clear previous state for this profile
      updateProfileTask(profile, { result: null });
      clearProfileLogs(profile);

      const activeWalletForTask = wallets.find(
        (wallet) => wallet.profileId === profile,
      );
      const shouldAttachWallet = !!activeWalletForTask;

      const runtimeOptions: AutomationRuntimeOptions = {};

      if (shouldAttachWallet) {
        const walletToUse = activeWalletForTask;

        if (!walletToUse) {
          const message =
            "No wallet assigned to this profile. Please assign a wallet in Wallet Management.";
          addProfileLog(profile, `ERROR: ${message}`);
          updateProfileTask(profile, {
            isRunning: false,
            result: { success: false, message },
          });
          return;
        }

        runtimeOptions.useWallet = true;
        runtimeOptions.walletId = walletToUse.id;
        addProfileLog(
          profile,
          `[WALLET] Attaching wallet: ${walletToUse.name}`,
        );
      }

      if (fileUploadDirectory?.trim()) {
        runtimeOptions.fileUploadDirectory = fileUploadDirectory.trim();
        addProfileLog(
          profile,
          `[FILES] Upload directory set to: ${runtimeOptions.fileUploadDirectory}`,
        );
      }

      // Log the model configuration
      addProfileLog(
        profile,
        `🤖 Using ${modelConfig.provider} model: ${modelConfig.model}`,
      );

      if (modelConfig.apiKey) {
        addProfileLog(
          profile,
          `✅ API key configured for ${modelConfig.provider}`,
        );
      } else if (modelConfig.provider === "ollama") {
        addProfileLog(profile, `🏠 Using local Ollama (no API key required)`);
      } else {
        addProfileLog(
          profile,
          `⚠️ No API key provided for ${modelConfig.provider}`,
        );
      }

      addProfileLog(profile, `Starting automation task: ${taskId}`);
      addProfileLog(profile, `Prompt: ${trimmedPrompt}`);

      startProfileTask(profile);

      const response = await (
        window as unknown as Window
      ).electronAPI.runBrowserAutomationTask(
        taskId,
        profile,
        enhancedPrompt, // Use enhanced prompt with rule if attached
        modelConfig.apiKey ? modelConfig : undefined,
        Object.keys(runtimeOptions).length ? runtimeOptions : undefined,
      );

      if (response.success) {
        addProfileLog(profile, `Automation completed: ${response.message}`);

        // Save automation data to backend
        await saveAutomationData(
          trimmedPrompt,
          response.automationData,
          response.logs || [],
          true,
          response.message,
        );

        updateProfileTask(profile, {
          isRunning: false,
          result: {
            success: true,
            message: response.message,
          },
        });
      } else {
        addProfileLog(profile, `Automation failed: ${response.message}`);
        updateProfileTask(profile, {
          isRunning: false,
          result: {
            success: response.success ?? false,
            message: response.message,
          },
        });

        // Always save failed automation data for analysis (even without automationData)
        await saveAutomationData(
          trimmedPrompt,
          response.automationData,
          response.logs || [],
          false,
          response.message,
        );
      }

      if (response.logs && response.logs.length > 0) {
        response.logs.forEach((log) => addProfileLog(profile, log));
      }

      if (response.success) {
        setLocalPrompt("");
        setProfilePrompt(profile, "");
      }

      // Clear the attached rule after task completion
      clearProfileAttachedRule(profile);
    } catch (error: unknown) {
      console.error("Error starting automation:", error);
      const message = (error as Error).message;
      addProfileLog(profile, `ERROR: Failed to start automation: ${message}`);

      // Save error data to backend for analysis
      await saveAutomationData(
        trimmedPrompt,
        null,
        profileState.logs,
        false,
        `Failed to start automation: ${message}`,
      );

      const latestState = getProfileState(profile);
      if (latestState.currentTask) {
        updateProfileTask(profile, {
          isRunning: false,
          result: { success: false, message },
        });
      }

      // Clear the attached rule after task failure
      clearProfileAttachedRule(profile);
    }
  };

  const handleStopTask = async () => {
    try {
      await stopProfileTask(profile);
    } catch (error) {
      console.error("Error stopping task:", error);
    }
  };

  const canStart =
    canCreateTaskForProfile(profile) && localPrompt.trim().length > 0;
  const isRunning = profileState.currentTask?.isRunning || false;

  return (
    <div className="flex min-w-0 grow flex-col gap-5 overflow-auto">
      {profileState.logs.length > 0 && (
        <div className="terminal-scrollbar max-h-[calc(100vh-270px)] overflow-auto border border-white/10 bg-black/30 p-4 font-mono text-sm backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-medium text-white/80">
              Console Output - {profile}
            </span>
            <span className="text-xs text-white/50">
              {profileState.logs.length} log entries
            </span>
          </div>
          {profileState.logs.map((log, index) => (
            <div
              key={index}
              className={`py-1 select-text ${log.startsWith("ERROR:") ? "text-red-300" : "text-white/80"}`}
            >
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Result display */}
      {profileState.result && (
        <div
          className={`border p-4 text-sm ${
            profileState.result.success
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          <div className="mb-1 font-semibold">
            {profileState.result.success ? "Success" : "Error"}
          </div>
          <div>{profileState.result.message}</div>
        </div>
      )}

      {/* AI Rule status display */}
      {(isSearchingRules ||
        profileState.attachedRule ||
        profileState.ruleError) && (
        <div className="border border-blue-500/30 bg-blue-500/10 p-4 text-sm backdrop-blur-sm">
          {isSearchingRules && (
            <div className="flex items-center gap-2 text-blue-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-blue-500"></div>
              <span>Retrieving AI rules...</span>
            </div>
          )}

          {!isSearchingRules && profileState.attachedRule && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="font-semibold text-white">Attached Rule:</span>
                <span className="text-blue-200">
                  {profileState.attachedRule.name}
                </span>
              </div>
              <div className="text-white/70">
                <span className="text-white/50">Description:</span>{" "}
                {profileState.attachedRule.description}
              </div>
              {profileState.attachedRule.similarity_score && (
                <div className="text-xs text-white/50">
                  Similarity score:{" "}
                  {(profileState.attachedRule.similarity_score * 100).toFixed(
                    1,
                  )}
                  %
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-white/60 hover:text-white/80">
                  View rule details
                </summary>
                <div className="mt-2 max-h-32 overflow-auto border-l-2 border-blue-500/30 bg-black/20 p-2 text-xs text-white/70">
                  {profileState.attachedRule.rule}
                </div>
              </details>
            </div>
          )}

          {!isSearchingRules &&
            !profileState.attachedRule &&
            profileState.ruleError && (
              <div className="flex items-center gap-2 text-yellow-300">
                <span>⚠</span>
                <span>
                  No matching AI rule found - proceeding with original prompt
                </span>
              </div>
            )}
        </div>
      )}

      {/* Form for entering prompt */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isRunning) {
            handleSubmit();
          }
        }}
        className="mt-auto flex border border-white/20 bg-black/40 backdrop-blur-sm"
      >
        <div className="relative grow">
          <textarea
            rows={2}
            value={localPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            disabled={isRunning}
            placeholder={
              isRunning
                ? "Automation in progress... Please wait while the task is being performed..."
                : "Enter natural language automation prompt..."
            }
            className="w-full min-w-0 resize-none border-none bg-transparent px-4 py-3 text-white placeholder-white/50 focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleEnhancePrompt}
            disabled={isLoading || !localPrompt.trim()}
            className="absolute right-0 bg-blue-600/20 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600/30 disabled:opacity-40"
          >
            {isLoading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Wand2 size={16} />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={isRunning}
            className="absolute right-10 bg-blue-600/20 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600/30 disabled:opacity-40"
            title="Expand"
          >
            <Maximize2 size={16} />
          </button>
          <div className="absolute right-3 bottom-2 text-xs text-white/40">
            {localPrompt.length} chars
          </div>
        </div>

        <div className="flex">
          {isRunning ? (
            <button
              type="button"
              onClick={handleStopTask}
              className="relative border-l border-red-500/30 bg-red-500/20 px-8 font-medium text-white transition-colors hover:bg-red-500/30"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-red-600/70"></div>
              </div>
              <OctagonPause color="red" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canStart}
              className="border-l border-white/20 bg-white/10 px-8 font-medium text-white transition-colors hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30"
            >
              Run
            </button>
          )}
        </div>
      </form>

      {/* Prompt Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Prompt"
        size="xl"
      >
        <div className="space-y-4">
          <textarea
            value={localPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            className="w-full resize-none border border-white/20 bg-black/40 p-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
            rows={12}
            placeholder="Enter natural language automation prompt..."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="border border-white/20 bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="border border-white/20 bg-blue-600/20 px-4 py-2 text-white transition-colors hover:bg-blue-600/30"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

function AutomationTerminalPage() {
  const {
    activeProfile,
    setActiveProfile,
    profileStates,
    getRunningProfilesCount,
  } = useAutomationStore();
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "saved">("history");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleRef = useRef<HTMLDivElement | null>(null);

  const parseAutomationResult = useCallback((log: string) => {
    const match = log.match(/\[(?:COMPLETE|SUCCESS)\] Final result:\s*(.*)$/);
    if (!match) {
      return null;
    }

    try {
      const payload = JSON.parse(match[1]);
      if (
        payload &&
        typeof payload === "object" &&
        "success" in payload &&
        typeof payload.success === "boolean" &&
        "message" in payload &&
        typeof payload.message === "string"
      ) {
        return {
          success: payload.success,
          message: payload.message as string,
        };
      }
    } catch (error) {
      console.error("Failed to parse automation result log:", error, log);
    }

    return null;
  }, []);

  const handlePromptSelect = useCallback(
    (prompt: string) => {
      const { setProfilePrompt } = useAutomationStore.getState();
      setProfilePrompt(activeProfile, prompt);
      setSidebarOpen(false); // Close sidebar after selection
    },
    [activeProfile],
  );
  const loadProfilesFromStore = useCallback(async () => {
    try {
      setIsLoading(true);
      const browserSettings = useBrowserSettingsStore.getState().settings;

      const currentBrowserProfiles = browserSettings.availableProfiles || [
        "default_profile",
      ];

      setAvailableProfiles(currentBrowserProfiles);

      const targetProfile =
        activeProfile && currentBrowserProfiles.includes(activeProfile)
          ? activeProfile
          : currentBrowserProfiles[0];

      setActiveProfile(targetProfile);
      console.log("Loaded profiles for automation:", {
        useSystemBrowser: browserSettings.useSystemBrowser,
        systemBrowserPath: browserSettings.systemBrowserPath,
        currentBrowserProfiles,
        selectedProfile: targetProfile,
        availableProfiles: browserSettings.availableProfiles,
      });
    } catch (error) {
      console.error("Error loading profiles:", error);
      setAvailableProfiles(["default_profile"]);
      setActiveProfile("default_profile");
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile, setActiveProfile]);

  useEffect(() => {
    loadProfilesFromStore();
  }, [loadProfilesFromStore]);

  const tabsRef = useRef<HTMLDivElement | null>(null);

  const handleTabsWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = tabsRef.current;
    if (!el) return;

    if (el.scrollWidth <= el.clientWidth) return;

    let delta = e.deltaY;
    const wheelEvent = e as unknown as WheelEvent;
    if (wheelEvent.deltaMode === 1) {
      delta *= 24;
    } else if (wheelEvent.deltaMode === 2) {
      delta *= el.clientHeight;
    }

    const scrollAmount =
      Math.sign(delta) * Math.min(Math.abs(delta) * 1.5, 120);

    if (typeof el.scrollBy === "function") {
      el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    } else {
      el.scrollLeft += scrollAmount;
    }

    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, reloading profiles...");
      loadProfilesFromStore();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadProfilesFromStore]);

  useEffect(() => {
    const electronAPI = (window as unknown as Window).electronAPI;

    if (!electronAPI) return;

    const handleAutomationLog = (
      data: string | { taskId?: string; log: string },
    ) => {
      console.log("Automation log received:", data);

      if (typeof data === "string") {
        const { addProfileLog, updateProfileTask } =
          useAutomationStore.getState();
        addProfileLog(activeProfile, data);

        const parsedResult = parseAutomationResult(data);
        if (parsedResult) {
          updateProfileTask(activeProfile, {
            isRunning: false,
            result: {
              success: parsedResult.success,
              message: parsedResult.message,
            },
          });
        }
      } else if (data.taskId && data.log) {
        const { profileStates, addProfileLog, updateProfileTask } =
          useAutomationStore.getState();
        for (const [profile, state] of Object.entries(profileStates)) {
          if (state.currentTask?.id === data.taskId) {
            addProfileLog(profile, data.log);

            const parsedResult = parseAutomationResult(data.log);

            if (parsedResult) {
              updateProfileTask(profile, {
                isRunning: false,
                result: {
                  success: parsedResult.success,
                  message: parsedResult.message,
                },
              });
            } else if (
              data.log.includes("Automation completed") ||
              data.log.includes("Task completed")
            ) {
              updateProfileTask(profile, {
                isRunning: false,
                result: { success: true, message: data.log },
              });
            }
            break;
          }
        }
      }
    };

    // Handle automation errors
    const handleAutomationError = (
      data: string | { taskId?: string; error: string },
    ) => {
      console.log("Automation error received:", data);

      if (typeof data === "string") {
        // Legacy format - add to active profile
        const { addProfileLog } = useAutomationStore.getState();
        addProfileLog(activeProfile, `ERROR: ${data}`);
      } else if (data.taskId && data.error) {
        // Task-specific format - find profile from taskId
        const { profileStates, addProfileLog, updateProfileTask } =
          useAutomationStore.getState();
        for (const [profile, state] of Object.entries(profileStates)) {
          if (state.currentTask?.id === data.taskId) {
            addProfileLog(profile, `ERROR: ${data.error}`);

            // Mark task as failed
            updateProfileTask(profile, {
              isRunning: false,
              result: { success: false, message: data.error },
            });
            break;
          }
        }
      }
    };

    // Set up listeners
    const logUnsubscribe =
      electronAPI.onBrowserAutomationLog(handleAutomationLog);
    const errorUnsubscribe = electronAPI.onBrowserAutomationError(
      handleAutomationError,
    );

    // Cleanup
    return () => {
      logUnsubscribe();
      errorUnsubscribe();
    };
  }, [activeProfile, parseAutomationResult]);

  if (isLoading) {
    return (
      <div className="relative flex h-full w-full flex-col select-none">
        <PageTitle title="Browser Automation">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse bg-blue-400"></div>
            <span className="text-sm font-medium text-blue-400">
              Loading...
            </span>
          </div>
        </PageTitle>
        <div className="flex grow items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-white/70"></div>
            <span className="text-white/70">Loading profiles...</span>
          </div>
        </div>
      </div>
    );
  }

  const runningProfilesCount = getRunningProfilesCount();
  const currentProfileState = profileStates[activeProfile];
  const isCurrentProfileRunning =
    currentProfileState?.currentTask?.isRunning || false;

  return (
    <div className="relative flex h-full w-full overflow-hidden pr-11 select-none">
      {/* Main Content */}
      <div className="flex w-full flex-col">
        <PageTitle title="Browser Automation">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isCurrentProfileRunning ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse bg-green-400"></div>
                  <span className="text-sm font-medium text-green-400">
                    Running
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-gray-400"></div>
                  <span className="text-sm font-medium">Ready</span>
                </div>
              )}
            </div>
            {runningProfilesCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-orange-400"></div>
                <span className="text-sm font-medium text-orange-400">
                  {runningProfilesCount} task
                  {runningProfilesCount !== 1 ? "s" : ""} running
                </span>
              </div>
            )}
            <button
              className="border border-white/10 bg-transparent px-3 py-1 text-sm text-white/70 transition-colors hover:bg-white/5"
              disabled={isCurrentProfileRunning}
              onClick={() => {
                const {
                  clearProfileLogs,
                  updateProfileTask,
                  clearProfileAttachedRule,
                  setProfilePrompt,
                } = useAutomationStore.getState();
                clearProfileLogs(activeProfile);
                updateProfileTask(activeProfile, { result: null });
                clearProfileAttachedRule(activeProfile);
                setProfilePrompt(activeProfile, "");
              }}
            >
              Clear
            </button>
          </div>
        </PageTitle>

        {/* Profile Tabs and Content */}
        <div className="flex h-full flex-col gap-3 overflow-hidden px-6 py-4">
          <nav
            ref={tabsRef}
            onWheel={handleTabsWheel}
            className="flex flex-row flex-nowrap items-end gap-0.5 overflow-x-auto pr-2 pb-1"
          >
            {availableProfiles.map((profile) => {
              const hasRunningTask =
                profileStates[profile]?.currentTask?.isRunning || false;
              return (
                <ProfileTab
                  key={profile}
                  profile={profile}
                  isActive={activeProfile === profile}
                  hasRunningTask={hasRunningTask}
                  onClick={() => setActiveProfile(profile)}
                />
              );
            })}
          </nav>

          {/* Active Profile Panel */}
          <ProfileAutomationPanel profile={activeProfile} />
        </div>
      </div>

      {/* Fixed Icon Strip */}
      <div
        ref={toggleRef}
        className="absolute top-0 right-0 z-20 flex h-full w-12 flex-col border-l border-white/5 bg-black/20 backdrop-blur-sm"
      >
        <div className="flex grow flex-col gap-2">
          <button
            onClick={() => {
              if (activeTab === "history") {
                // Toggle when clicking the same tab
                setSidebarOpen((open) => !open);
              } else {
                // Switch to the tab and ensure sidebar opens
                setActiveTab("history");
                setSidebarOpen(true);
              }
            }}
            className={`mx-auto flex size-10 items-center justify-center rounded transition-colors ${
              activeTab === "history" && sidebarOpen
                ? "bg-white/10 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
            title="Prompt History"
          >
            <Clock className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              if (activeTab === "saved") {
                setSidebarOpen((open) => !open);
              } else {
                setActiveTab("saved");
                setSidebarOpen(true);
              }
            }}
            className={`mx-auto flex size-10 items-center justify-center rounded transition-colors ${
              activeTab === "saved" && sidebarOpen
                ? "bg-white/10 text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
            title="Saved Prompts"
          >
            <Star className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <PromptSidebar
        onPromptSelect={handlePromptSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        toggleRef={toggleRef}
      />
    </div>
  );
}

export default AutomationTerminalPage;
