import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AutomationRuntimeOptions,
  Window,
} from "../../../types/global-types";
import type { AiRule } from "../types/aiRule";
import { useAISettingsStore } from "./AISettingsStore";
import { useWalletStore } from "./WalletStore";

export interface AutomationTask {
  id: string;
  profile: string;
  prompt: string;
  isRunning: boolean;
  logs: string[];
  result: {
    success: boolean;
    message: string;
    logs?: string[];
  } | null;
  createdAt: Date;
}

export interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  profile: string;
  usedAt: Date;
}

export interface ScheduledTask {
  id: string;
  name: string;
  prompt: string;
  profiles: string[];
  startTime: Date;
  endTime: Date;
  intervalMinutes: number;
  isActive: boolean;
  createdAt: Date;
  lastExecutedAt: Date | null;
  nextExecutionAt: Date | null;
  executionCount: number;
  maxExecutions?: number; // optional limit on total executions
}

export interface ProfileAutomationState {
  currentTask: AutomationTask | null;
  prompt: string;
  logs: string[];
  result: {
    success: boolean;
    message: string;
    logs?: string[];
  } | null;
  isRunning: boolean;
  attachedRule: AiRule | null;
  isRetrievingRule: boolean;
  ruleError: string | null;
}

export interface AutomationState {
  // Legacy single automation state for backward compatibility
  isRunning: boolean;
  prompt: string;
  logs: string[];
  result: {
    success: boolean;
    message: string;
    logs?: string[];
  } | null;

  // New multi-profile state - each profile has its own state
  profileStates: Record<string, ProfileAutomationState>;
  activeProfile: string;
  // Track scheduled start timers so they can be cancelled
  scheduledStartTimeouts: Array<{
    timer: ReturnType<typeof setTimeout>;
    profile: string;
  }>;

  // Multi-profile management state
  selectedProfiles: string[];
  allAvailableProfiles: string[];

  // Prompt history and saved prompts
  promptHistory: PromptHistoryItem[];
  savedPrompts: SavedPrompt[];
  sidebarCollapsed: boolean;

  // Scheduled tasks
  scheduledTasks: ScheduledTask[];
  scheduledTaskTimers: Map<
    string,
    { intervalTimer?: NodeJS.Timeout; initialTimer?: NodeJS.Timeout }
  >;
  // Track which profiles were started by a scheduled task run so we can stop them
  scheduledTaskRunningProfiles: Map<string, string[]>;

  // Legacy methods
  setIsRunning: (isRunning: boolean) => void;
  setPrompt: (prompt: string) => void;
  setLogs: (logs: string[]) => void;
  addLog: (log: string) => void;
  addLogs: (logs: string[]) => void;
  clearLogs: () => void;
  setResult: (
    result: {
      success: boolean;
      message: string;
      logs?: string[];
    } | null,
  ) => void;
  stopAutomation: () => Promise<void>;

  // New methods for profile-based automation
  setActiveProfile: (profile: string) => void;
  getProfileState: (profile: string) => ProfileAutomationState;
  createTaskForProfile: (profile: string, prompt: string) => string | null;
  updateProfileTask: (
    profile: string,
    updates: Partial<AutomationTask>,
  ) => void;
  addProfileLog: (profile: string, log: string) => void;
  addProfileLogs: (profile: string, logs: string[]) => void;
  clearProfileLogs: (profile: string) => void;
  stopProfileTask: (profile: string) => Promise<void>;
  canCreateTaskForProfile: (profile: string) => boolean;
  setProfilePrompt: (profile: string, prompt: string) => void;
  getRunningProfilesCount: () => number;
  hasAnyRunningOrQueuedTasks: () => boolean;
  startProfileTask: (profile: string) => void;
  syncLegacyState: () => void;
  stopAllTasks: () => Promise<void>;
  // Cancel any queued (not yet started) profile starts
  clearScheduledStarts: () => void;
  cancelScheduledStartsForProfiles: (profiles: string[]) => void;
  isProfileQueued: (profile: string) => boolean;

  // Multi-profile operations
  createTasksForMultipleProfiles: (
    profiles: string[],
    prompt: string,
  ) => string[];
  startTasksForMultipleProfiles: (
    profiles: string[],
    prompt: string,
    delayMs?: number,
  ) => void;
  stopTasksForProfiles: (profiles: string[]) => Promise<void>;
  getSelectedProfiles: () => string[];
  setSelectedProfiles: (profiles: string[]) => void;
  getAllAvailableProfiles: () => string[];
  setAllAvailableProfiles: (profiles: string[]) => void;

  // Prompt history and saved prompts methods
  addToHistory: (prompt: string, profile: string) => void;
  clearHistory: () => void;
  deleteFromHistory: (id: string) => void;
  savePrompt: (name: string, prompt: string) => void;
  deleteSavedPrompt: (id: string) => void;
  updateSavedPrompt: (id: string, name: string, prompt: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Scheduled tasks methods
  createScheduledTask: (
    name: string,
    prompt: string,
    profiles: string[],
    startTime: Date,
    endTime: Date,
    intervalMinutes: number,
    maxExecutions?: number,
  ) => string;
  updateScheduledTask: (id: string, updates: Partial<ScheduledTask>) => void;
  deleteScheduledTask: (id: string) => void;
  toggleScheduledTask: (id: string) => void;
  getScheduledTasks: () => ScheduledTask[];
  getActiveScheduledTasks: () => ScheduledTask[];
  executeScheduledTask: (taskId: string) => Promise<void>;
  checkAndExecuteScheduledTasks: () => void;

  // AI Rule methods
  setProfileAttachedRule: (profile: string, rule: AiRule | null) => void;
  setProfileRetrievingRule: (profile: string, isRetrieving: boolean) => void;
  setProfileRuleError: (profile: string, error: string | null) => void;
  clearProfileAttachedRule: (profile: string) => void;
  stopAllScheduledTasks: () => void;
  restoreScheduledTaskTimers: () => void;
}

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set, get) => ({
      // Legacy state
      isRunning: false,
      prompt: "",
      logs: [],
      result: null,

      // New state
      profileStates: {},
      activeProfile: "default_profile",

      // Multi-profile management state
      selectedProfiles: [],
      allAvailableProfiles: [],
      scheduledStartTimeouts: [],

      // Prompt history and saved prompts
      promptHistory: [],
      savedPrompts: [],
      sidebarCollapsed: true,

      // Scheduled tasks
      scheduledTasks: [],
      scheduledTaskTimers: new Map(),
      scheduledTaskRunningProfiles: new Map(),
      // Legacy methods - now mapped to active profile
      setIsRunning: (isRunning) => {
        set({ isRunning });
        // Also update the active profile state
        const state = get();
        const activeProfile = state.activeProfile;
        if (state.profileStates[activeProfile]?.currentTask) {
          get().updateProfileTask(activeProfile, { isRunning });
        }
      },
      setPrompt: (prompt) => {
        set({ prompt });
        // Also update the active profile
        const activeProfile = get().activeProfile;
        get().setProfilePrompt(activeProfile, prompt);
      },
      setLogs: (logs) => {
        set({ logs });
        // Also update the active profile
        const activeProfile = get().activeProfile;
        set((state) => ({
          profileStates: {
            ...state.profileStates,
            [activeProfile]: {
              ...state.profileStates[activeProfile],
              logs: logs,
            },
          },
        }));
      },
      addLog: (log) => {
        set((state) => ({ logs: [...state.logs, log] }));
        // Also add to active profile
        const activeProfile = get().activeProfile;
        get().addProfileLog(activeProfile, log);
      },
      addLogs: (newLogs) => {
        set((state) => ({ logs: [...state.logs, ...newLogs] }));
        // Also add to active profile
        const activeProfile = get().activeProfile;
        get().addProfileLogs(activeProfile, newLogs);
      },
      clearLogs: () => {
        set({ logs: [] });
        // Also clear active profile logs
        const activeProfile = get().activeProfile;
        get().clearProfileLogs(activeProfile);
      },
      setResult: (result) => {
        set({ result });
        // Also update active profile result
        const activeProfile = get().activeProfile;
        if (get().profileStates[activeProfile]?.currentTask) {
          get().updateProfileTask(activeProfile, { result });
        }
      },
      stopAutomation: async () => {
        try {
          const response = await (
            window as unknown as Window
          ).electronAPI.stopBrowserAutomation();

          // Add the log to the store
          get().addLog(`Automation stopped: ${response.message}`);
          console.log("Stop automation response:", response);
        } catch (error: unknown) {
          console.error("Error stopping automation:", error);
          get().addLog(
            `ERROR: Failed to stop automation: ${(error as Error).message}`,
          );
        }
      },

      // New methods for profile-based automation
      setActiveProfile: (profile: string) => {
        set({ activeProfile: profile });
        // Sync legacy state with new active profile
        get().syncLegacyState();
      },

      getProfileState: (profile: string) => {
        const state = get();
        if (!state.profileStates[profile]) {
          // Initialize profile state if it doesn't exist
          set((prevState) => ({
            profileStates: {
              ...prevState.profileStates,
              [profile]: {
                currentTask: null,
                prompt: "",
                logs: [],
                result: null,
                isRunning: false,
                attachedRule: null,
                isRetrievingRule: false,
                ruleError: null,
              },
            },
          }));
          return {
            currentTask: null,
            prompt: "",
            logs: [],
            result: null,
            isRunning: false,
            attachedRule: null,
            isRetrievingRule: false,
            ruleError: null,
          };
        }
        return state.profileStates[profile];
      },

      createTaskForProfile: (profile: string, prompt: string) => {
        const profileState = get().getProfileState(profile);

        // Check if profile already has a running task
        if (profileState.currentTask?.isRunning) {
          console.warn(
            `Cannot create task for profile ${profile}: task already running`,
          );
          return null;
        }

        const taskId = `task-${profile}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newTask: AutomationTask = {
          id: taskId,
          profile,
          prompt,
          isRunning: false,
          logs: [],
          result: null,
          createdAt: new Date(),
        };

        set((state) => ({
          profileStates: {
            ...state.profileStates,
            [profile]: {
              ...profileState,
              currentTask: newTask,
              prompt: "",
              isRunning: false,
            },
          },
        }));

        // Add to history
        get().addToHistory(prompt, profile);

        return taskId;
      },
      updateProfileTask: (
        profile: string,
        updates: Partial<AutomationTask>,
      ) => {
        set((state) => {
          const profileState = state.profileStates[profile];
          if (!profileState?.currentTask) return state;

          return {
            profileStates: {
              ...state.profileStates,
              [profile]: {
                ...profileState,
                currentTask: { ...profileState.currentTask, ...updates },
                isRunning: Object.prototype.hasOwnProperty.call(
                  updates,
                  "isRunning",
                )
                  ? (updates.isRunning as boolean)
                  : profileState.isRunning,
                result: Object.prototype.hasOwnProperty.call(updates, "result")
                  ? (updates.result as typeof profileState.result)
                  : profileState.result,
              },
            },
          };
        });

        // Always sync legacy state when tasks are updated
        get().syncLegacyState();
      },

      addProfileLog: (profile: string, log: string) => {
        set((state) => {
          const profileState = state.profileStates[profile];
          if (!profileState) {
            // Initialize if doesn't exist
            return {
              profileStates: {
                ...state.profileStates,
                [profile]: {
                  currentTask: null,
                  prompt: "",
                  logs: [log],
                  result: null,
                  isRunning: false,
                  attachedRule: null,
                  isRetrievingRule: false,
                  ruleError: null,
                },
              },
            };
          }

          const updatedProfileState = {
            ...profileState,
            logs: [...profileState.logs, log],
          };

          if (profileState.currentTask) {
            updatedProfileState.currentTask = {
              ...profileState.currentTask,
              logs: [...profileState.currentTask.logs, log],
            };
          }

          return {
            profileStates: {
              ...state.profileStates,
              [profile]: updatedProfileState,
            },
          };
        });
      },

      addProfileLogs: (profile: string, logs: string[]) => {
        set((state) => {
          const profileState = state.profileStates[profile];
          if (!profileState) {
            // Initialize if doesn't exist
            return {
              profileStates: {
                ...state.profileStates,
                [profile]: {
                  currentTask: null,
                  prompt: "",
                  logs: logs,
                  result: null,
                  isRunning: false,
                  attachedRule: null,
                  isRetrievingRule: false,
                  ruleError: null,
                },
              },
            };
          }

          const updatedProfileState = {
            ...profileState,
            logs: [...profileState.logs, ...logs],
          };

          if (profileState.currentTask) {
            updatedProfileState.currentTask = {
              ...profileState.currentTask,
              logs: [...profileState.currentTask.logs, ...logs],
            };
          }

          return {
            profileStates: {
              ...state.profileStates,
              [profile]: updatedProfileState,
            },
          };
        });
      },

      clearProfileLogs: (profile: string) => {
        set((state) => {
          const profileState = state.profileStates[profile];
          if (!profileState) return state;

          const updatedProfileState = {
            ...profileState,
            logs: [],
          };

          if (profileState.currentTask) {
            updatedProfileState.currentTask = {
              ...profileState.currentTask,
              logs: [],
            };
          }

          return {
            profileStates: {
              ...state.profileStates,
              [profile]: updatedProfileState,
            },
          };
        });
      },
      stopProfileTask: async (profile: string) => {
        const profileState = get().getProfileState(profile);
        if (!profileState.currentTask?.isRunning) {
          console.warn(`No running task to stop for profile ${profile}`);
          return;
        }

        try {
          const response = await (
            window as unknown as Window
          ).electronAPI.stopBrowserAutomationTask(profileState.currentTask.id);

          // Update profile with stop result
          get().addProfileLog(
            profile,
            `Automation stopped: ${response.message}`,
          );
          get().updateProfileTask(profile, { isRunning: false });

          console.log("Stop profile task response:", response);
        } catch (error: unknown) {
          console.error("Error stopping profile task:", error);
          get().addProfileLog(
            profile,
            `ERROR: Failed to stop automation: ${(error as Error).message}`,
          );
        }
      },

      canCreateTaskForProfile: (profile: string) => {
        const profileState = get().getProfileState(profile);
        return !profileState.currentTask?.isRunning;
      },

      setProfilePrompt: (profile: string, prompt: string) => {
        set((state) => {
          const profileState = state.profileStates[profile] || {
            currentTask: null,
            prompt: "",
            logs: [],
            result: null,
            isRunning: false,
          };

          return {
            profileStates: {
              ...state.profileStates,
              [profile]: {
                ...profileState,
                prompt,
              },
            },
          };
        });
      },

      getRunningProfilesCount: () => {
        const state = get();
        return Object.values(state.profileStates).filter(
          (profileState) => profileState.currentTask?.isRunning,
        ).length;
      },

      hasAnyRunningOrQueuedTasks: () => {
        const state = get();
        // Check for any running tasks
        const hasRunningTasks = Object.values(state.profileStates).some(
          (profileState) => profileState.currentTask?.isRunning,
        );
        // Check for any queued tasks
        const hasQueuedTasks = state.scheduledStartTimeouts.length > 0;
        return hasRunningTasks || hasQueuedTasks;
      },

      startProfileTask: (profile: string) => {
        set((state) => {
          const profileState = state.profileStates[profile];
          if (!profileState?.currentTask) return state;

          return {
            profileStates: {
              ...state.profileStates,
              [profile]: {
                ...profileState,
                currentTask: { ...profileState.currentTask, isRunning: true },
                isRunning: true,
              },
            },
          };
        });

        // Sync legacy state if this is the active profile
        const activeProfile = get().activeProfile;
        if (profile === activeProfile) {
          get().syncLegacyState();
        }
      },
      syncLegacyState: () => {
        const state = get();
        const activeProfileState = state.profileStates[state.activeProfile];

        // Check if ANY profile has a running task for the global isRunning state
        const hasAnyRunningTask = Object.values(state.profileStates).some(
          (profileState) => profileState.currentTask?.isRunning,
        );

        if (activeProfileState) {
          set({
            isRunning: hasAnyRunningTask, // Global running state for main layout
            prompt: activeProfileState.prompt,
            logs: activeProfileState.logs,
            result: activeProfileState.result,
          });
        } else {
          set({
            isRunning: hasAnyRunningTask,
          });
        }
      },
      stopAllTasks: async () => {
        const state = get();
        const runningProfiles = Object.entries(state.profileStates)
          .filter(([, profileState]) => profileState.currentTask?.isRunning)
          .map(([profile]) => profile);

        console.log(`Stopping ${runningProfiles.length} running tasks...`);

        // Stop all running tasks in parallel
        const stopPromises = runningProfiles.map(async (profile) => {
          try {
            await get().stopProfileTask(profile);
            console.log(`Stopped task for profile: ${profile}`);
          } catch (error) {
            console.error(`Failed to stop task for profile ${profile}:`, error);
            // Add error log to the profile
            get().addProfileLog(
              profile,
              `ERROR: Failed to stop task: ${(error as Error).message}`,
            );
          }
        });

        await Promise.all(stopPromises);

        // Update legacy state
        get().syncLegacyState();

        console.log("All tasks stopped");
      },

      clearScheduledStarts: () => {
        const state = get();
        if (
          !state.scheduledStartTimeouts ||
          state.scheduledStartTimeouts.length === 0
        )
          return;

        state.scheduledStartTimeouts.forEach(({ timer, profile }) => {
          try {
            // timer can be a number (browser) or Timeout object (node); cast through unknown
            clearTimeout(timer as unknown as number);
            get().addProfileLog(profile, `Scheduled start cancelled`);
          } catch (err) {
            console.error("Error clearing scheduled timeout", err);
          }
        });

        // Clear the list
        set({ scheduledStartTimeouts: [] });
      },

      cancelScheduledStartsForProfiles: (profiles: string[]) => {
        if (profiles.length === 0) return;
        const state = get();
        if (!state.scheduledStartTimeouts.length) return;
        const remaining: typeof state.scheduledStartTimeouts = [];
        state.scheduledStartTimeouts.forEach((entry) => {
          if (profiles.includes(entry.profile)) {
            try {
              clearTimeout(entry.timer as unknown as number);
              get().addProfileLog(entry.profile, `Queued start cancelled`);
            } catch (e) {
              console.error("Failed to cancel queued start", e);
            }
          } else {
            remaining.push(entry);
          }
        });
        set({ scheduledStartTimeouts: remaining });
      },

      isProfileQueued: (profile: string) => {
        const state = get();
        return state.scheduledStartTimeouts.some((t) => t.profile === profile);
      },

      // Multi-profile operations
      createTasksForMultipleProfiles: (profiles: string[], prompt: string) => {
        const taskIds: string[] = [];

        profiles.forEach((profile) => {
          const taskId = get().createTaskForProfile(profile, prompt);
          if (taskId) {
            taskIds.push(taskId);
          }
        });

        return taskIds;
      },

      startTasksForMultipleProfiles: (
        profiles: string[],
        prompt: string,
        delayMs?: number,
      ) => {
        const { activeProvider, configs, fileUploadDirectory } =
          useAISettingsStore.getState();
        const modelConfig = configs[activeProvider];
        // Configurable delay between starting each profile to avoid CPU spikes
        const DELAY_BETWEEN_STARTS_MS =
          typeof delayMs === "number" && delayMs >= 0 ? delayMs : 5000;

        // Create tasks for all profiles first (so IDs are known and UI can show queued state)
        const taskIds = get().createTasksForMultipleProfiles(profiles, prompt);
        if (taskIds.length === 0) {
          console.warn("No tasks could be created for the selected profiles");
          return;
        }

        console.log(
          `Scheduling ${taskIds.length} tasks (stagger ${DELAY_BETWEEN_STARTS_MS}ms): ${profiles.join(", ")}`,
        );

        const fetchWalletForProfile = async (profile: string) => {
          let walletState = useWalletStore.getState();

          if (!walletState.wallets.length) {
            try {
              const result = await (
                window as unknown as Window
              ).electronAPI.getWallets();
              if (result.success && result.wallets) {
                walletState.setWallets(result.wallets);
              }
            } catch (error) {
              console.error("Failed to load wallets for automation:", error);
            }

            walletState = useWalletStore.getState();
          }

          return (
            walletState.wallets.find(
              (wallet) => wallet.profileId === profile,
            ) || null
          );
        };

        profiles.forEach((profile, index) => {
          const taskId = taskIds[index];
          if (!taskId) return;

          // Log queue status immediately
          get().addProfileLog(
            profile,
            `Queued (position ${index + 1}/${profiles.length}) - will start in ${index * (DELAY_BETWEEN_STARTS_MS / 1000)}s`,
          );

          const startFn = async () => {
            try {
              set((state) => ({
                scheduledStartTimeouts: state.scheduledStartTimeouts.filter(
                  (t) => t.profile !== profile,
                ),
              }));

              const runtimeOptions: AutomationRuntimeOptions = {};

              const profileWallet = await fetchWalletForProfile(profile);
              if (profileWallet) {
                runtimeOptions.useWallet = true;
                runtimeOptions.walletId = profileWallet.id;
                get().addProfileLog(
                  profile,
                  `[WALLET] Attaching wallet: ${profileWallet.name}`,
                );
              }

              const trimmedUploadDir = fileUploadDirectory?.trim();
              if (trimmedUploadDir) {
                runtimeOptions.fileUploadDirectory = trimmedUploadDir;
                get().addProfileLog(
                  profile,
                  `[FILES] Upload directory set to: ${trimmedUploadDir}`,
                );
              }

              if (modelConfig.apiKey) {
                get().addProfileLog(
                  profile,
                  `🤖 Using ${modelConfig.provider} model: ${modelConfig.model}`,
                );
              } else {
                get().addProfileLog(
                  profile,
                  "⚠️ No API key provided for the selected model, using default configuration",
                );
              }

              get().addProfileLog(
                profile,
                `Starting automation task: ${taskId}`,
              );
              get().addProfileLog(profile, `Prompt: ${prompt}`);

              get().startProfileTask(profile);

              try {
                const response = await (
                  window as unknown as Window
                ).electronAPI.runBrowserAutomationTask(
                  taskId,
                  profile,
                  prompt,
                  modelConfig.apiKey ? modelConfig : undefined,
                  Object.keys(runtimeOptions).length
                    ? runtimeOptions
                    : undefined,
                );

                get().addProfileLog(
                  profile,
                  `Automation started: ${response.message}`,
                );

                if (!response.success) {
                  get().addProfileLog(profile, `ERROR: ${response.message}`);
                  get().updateProfileTask(profile, {
                    isRunning: false,
                    result: {
                      success: response.success ?? false,
                      message: response.message,
                    },
                  });
                }

                if (response.logs && response.logs.length > 0) {
                  response.logs.forEach((log: string) =>
                    get().addProfileLog(profile, log),
                  );
                }
              } catch (error: unknown) {
                console.error(
                  `Error starting automation for profile ${profile}:`,
                  error,
                );
                get().addProfileLog(
                  profile,
                  `ERROR: Failed to start automation: ${(error as Error).message}`,
                );
                const refreshedState = get().getProfileState(profile);
                if (refreshedState.currentTask) {
                  get().updateProfileTask(profile, { isRunning: false });
                }
              }
            } catch (err) {
              console.error("Unexpected error scheduling start", err);
            }
          };

          // Schedule start with stagger and store timer so it can be cancelled
          const timer = setTimeout(() => {
            void startFn();
          }, index * DELAY_BETWEEN_STARTS_MS);
          set((state) => ({
            scheduledStartTimeouts: [
              ...state.scheduledStartTimeouts,
              { timer, profile },
            ],
          }));
        });
      },

      stopTasksForProfiles: async (profiles: string[]) => {
        const stopPromises = profiles.map(async (profile) => {
          try {
            await get().stopProfileTask(profile);
            console.log(`Stopped task for profile: ${profile}`);
          } catch (error) {
            console.error(`Failed to stop task for profile ${profile}:`, error);
            get().addProfileLog(
              profile,
              `ERROR: Failed to stop task: ${(error as Error).message}`,
            );
          }
        });

        await Promise.all(stopPromises);
        console.log(`Stopped tasks for ${profiles.length} profiles`);
      },

      getSelectedProfiles: () => {
        return get().selectedProfiles;
      },

      setSelectedProfiles: (profiles: string[]) => {
        set({ selectedProfiles: profiles });
      },

      getAllAvailableProfiles: () => {
        return get().allAvailableProfiles;
      },

      setAllAvailableProfiles: (profiles: string[]) => {
        set({ allAvailableProfiles: profiles });
      },

      // Prompt history and saved prompts methods
      addToHistory: (prompt: string, profile: string) => {
        const historyItem: PromptHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          prompt: prompt.trim(),
          profile,
          usedAt: new Date(),
        };

        set((state) => {
          // Remove duplicate prompts and keep only the latest 50 entries
          const filteredHistory = state.promptHistory.filter(
            (item) => item.prompt !== prompt.trim(),
          );
          const newHistory = [historyItem, ...filteredHistory].slice(0, 50);
          return { promptHistory: newHistory };
        });
      },

      clearHistory: () => {
        set({ promptHistory: [] });
      },

      deleteFromHistory: (id: string) => {
        set((state) => ({
          promptHistory: state.promptHistory.filter((item) => item.id !== id),
        }));
      },

      savePrompt: (name: string, prompt: string) => {
        const savedPrompt: SavedPrompt = {
          id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: name.trim(),
          prompt: prompt.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          savedPrompts: [...state.savedPrompts, savedPrompt],
        }));
      },

      deleteSavedPrompt: (id: string) => {
        set((state) => ({
          savedPrompts: state.savedPrompts.filter((prompt) => prompt.id !== id),
        }));
      },

      updateSavedPrompt: (id: string, name: string, prompt: string) => {
        set((state) => ({
          savedPrompts: state.savedPrompts.map((savedPrompt) =>
            savedPrompt.id === id
              ? {
                  ...savedPrompt,
                  name: name.trim(),
                  prompt: prompt.trim(),
                  updatedAt: new Date(),
                }
              : savedPrompt,
          ),
        }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Scheduled tasks methods
      createScheduledTask: (
        name: string,
        prompt: string,
        profiles: string[],
        startTime: Date,
        endTime: Date,
        intervalMinutes: number,
        maxExecutions?: number,
      ) => {
        const id = `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        // Validate inputs
        if (intervalMinutes < 1) {
          intervalMinutes = 1;
          console.warn("Minimum interval is 1 minute, correcting value");
        }

        if (startTime >= endTime) {
          throw new Error("End time must be after start time");
        }

        if (endTime <= now) {
          throw new Error("End time must be in the future");
        }

        const nextExecutionAt = startTime > now ? startTime : now;
        const shouldAutoActivate = startTime <= now; // Auto-activate if start time has passed

        const scheduledTask: ScheduledTask = {
          id,
          name: name.trim(),
          prompt: prompt.trim(),
          profiles,
          startTime,
          endTime,
          intervalMinutes,
          isActive: shouldAutoActivate, // Auto-activate if start time has passed
          createdAt: now,
          lastExecutedAt: null,
          nextExecutionAt,
          executionCount: 0,
          maxExecutions,
        };

        set((state) => ({
          scheduledTasks: [...state.scheduledTasks, scheduledTask],
        }));

        // If auto-activating, set up the timer immediately
        if (shouldAutoActivate) {
          setTimeout(() => {
            // Use a small delay to ensure state is updated
            get().toggleScheduledTask(id);
          }, 100);
        }

        return id;
      },

      updateScheduledTask: (id: string, updates: Partial<ScheduledTask>) => {
        // Validate intervalMinutes if being updated
        if (
          updates.intervalMinutes !== undefined &&
          updates.intervalMinutes < 1
        ) {
          updates.intervalMinutes = 1;
          console.warn("Minimum interval is 1 minute, correcting value");
        }

        set((state) => ({
          scheduledTasks: state.scheduledTasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task,
          ),
        }));
      },

      deleteScheduledTask: (id: string) => {
        const state = get();
        const timerInfo = state.scheduledTaskTimers.get(id);
        if (timerInfo) {
          if (timerInfo.intervalTimer) {
            clearInterval(timerInfo.intervalTimer);
          }
          if (timerInfo.initialTimer) {
            clearTimeout(timerInfo.initialTimer);
          }
          state.scheduledTaskTimers.delete(id);
        }

        // Also remove any running-profiles bookkeeping for this scheduled task
        set((state) => {
          const newMap = new Map(state.scheduledTaskRunningProfiles);
          newMap.delete(id);
          return {
            scheduledTasks: state.scheduledTasks.filter(
              (task) => task.id !== id,
            ),
            scheduledTaskRunningProfiles: newMap,
          } as Partial<AutomationState>;
        });
      },

      toggleScheduledTask: (id: string) => {
        const state = get();
        const task = state.scheduledTasks.find((t) => t.id === id);
        if (!task) return;

        if (task.isActive) {
          // Deactivate: clear both timers
          const timerInfo = state.scheduledTaskTimers.get(id);
          if (timerInfo) {
            if (timerInfo.intervalTimer) {
              clearInterval(timerInfo.intervalTimer);
            }
            if (timerInfo.initialTimer) {
              clearTimeout(timerInfo.initialTimer);
            }
            state.scheduledTaskTimers.delete(id);
          }
        } else {
          // Activate: set up timer
          const now = new Date();
          if (task.endTime <= now) {
            console.log(`Scheduled task ${task.name} has already expired`);
            return;
          }

          // Validate interval
          if (task.intervalMinutes < 1) {
            console.warn(
              `Invalid interval ${task.intervalMinutes} minutes, using 1 minute minimum`,
            );
            get().updateScheduledTask(id, { intervalMinutes: 1 });
          }

          const executeTask = () => {
            const currentState = get();
            const currentTask = currentState.scheduledTasks.find(
              (t) => t.id === id,
            );
            if (!currentTask || !currentTask.isActive) return;

            const now = new Date();
            if (now >= currentTask.endTime) {
              // Task has expired, deactivate it
              get().toggleScheduledTask(id);
              return;
            }

            if (
              currentTask.maxExecutions &&
              currentTask.executionCount >= currentTask.maxExecutions
            ) {
              // Max executions reached, deactivate
              get().toggleScheduledTask(id);
              return;
            }

            get().executeScheduledTask(id);
          };

          // Calculate initial delay - handle null nextExecutionAt safely
          const nextExecution = task.nextExecutionAt || task.startTime;
          const initialDelay = Math.max(
            0,
            nextExecution.getTime() - now.getTime(),
          );

          // Set up initial timeout and store it
          const initialTimer = setTimeout(() => {
            executeTask();
            // Set up recurring interval after first execution
            const intervalTimer = setInterval(
              executeTask,
              Math.max(task.intervalMinutes, 1) * 60 * 1000,
            );
            // Update timer info with interval timer, clearing initial timer
            state.scheduledTaskTimers.set(id, { intervalTimer });
          }, initialDelay);

          // Store initial timer
          state.scheduledTaskTimers.set(id, { initialTimer });
        }

        get().updateScheduledTask(id, { isActive: !task.isActive });
      },

      getScheduledTasks: () => {
        return get().scheduledTasks;
      },

      getActiveScheduledTasks: () => {
        return get().scheduledTasks.filter((task) => task.isActive);
      },

      executeScheduledTask: async (taskId: string) => {
        const state = get();
        const task = state.scheduledTasks.find((t) => t.id === taskId);
        if (!task || !task.isActive) return;

        const now = new Date();

        try {
          console.log(`Executing scheduled task: ${task.name}`);

          // Update execution tracking
          const nextExecution = new Date(
            now.getTime() + task.intervalMinutes * 60 * 1000,
          );
          get().updateScheduledTask(taskId, {
            lastExecutedAt: now,
            nextExecutionAt:
              nextExecution > task.endTime ? null : nextExecution,
            executionCount: task.executionCount + 1,
          });

          // Before starting new runs for this scheduled task, stop any previous
          // profiles that were started by the same scheduled task to avoid
          // overlapping automation runs. We track them in
          // `scheduledTaskRunningProfiles` so we can stop them here.
          const previousProfiles =
            state.scheduledTaskRunningProfiles.get(taskId) || [];
          if (previousProfiles.length > 0) {
            console.log(
              `Scheduled task ${task.name} stopping previous run for profiles: ${previousProfiles.join(", ")}`,
            );
            // Stop previous runs
            await get().stopTasksForProfiles(previousProfiles);
          }

          // Execute the task on selected profiles and remember which profiles
          // we started so we can stop them on the next interval if needed.
          get().startTasksForMultipleProfiles(task.profiles, task.prompt, 0);
          // Record that these profiles are the ones started by this scheduled task
          set((s) => {
            const newMap = new Map(s.scheduledTaskRunningProfiles);
            newMap.set(taskId, task.profiles.slice());
            return {
              scheduledTaskRunningProfiles: newMap,
            } as Partial<AutomationState>;
          });
        } catch (error) {
          console.error(`Error executing scheduled task ${task.name}:`, error);
        }
      },

      checkAndExecuteScheduledTasks: () => {
        // This method can be used for manual checking, but we're using timers instead
        const now = new Date();
        const state = get();

        state.scheduledTasks.forEach((task) => {
          if (
            task.isActive &&
            task.nextExecutionAt &&
            task.nextExecutionAt <= now
          ) {
            get().executeScheduledTask(task.id);
          }
        });
      },

      stopAllScheduledTasks: () => {
        const state = get();

        // Clear all timers
        state.scheduledTaskTimers.forEach((timerInfo) => {
          if (timerInfo.intervalTimer) {
            clearInterval(timerInfo.intervalTimer);
          }
          if (timerInfo.initialTimer) {
            clearTimeout(timerInfo.initialTimer);
          }
        });
        state.scheduledTaskTimers.clear();

        // Clear running-profiles bookkeeping and deactivate all tasks
        set((state) => ({
          scheduledTasks: state.scheduledTasks.map((task) => ({
            ...task,
            isActive: false,
          })),
          scheduledTaskRunningProfiles: new Map(),
        }));
      },

      restoreScheduledTaskTimers: () => {
        const state = get();
        const now = new Date();

        state.scheduledTasks.forEach((task) => {
          // Auto-activate tasks that should be running but aren't active yet
          if (!task.isActive && task.startTime <= now && task.endTime > now) {
            // Check if max executions reached
            if (
              task.maxExecutions &&
              task.executionCount >= task.maxExecutions
            ) {
              return;
            }

            console.log(`Auto-activating scheduled task: ${task.name}`);
            get().updateScheduledTask(task.id, { isActive: true });

            // Small delay to ensure state update, then activate
            setTimeout(() => {
              get().toggleScheduledTask(task.id);
            }, 200);
            return;
          }

          // Restore timers for already active tasks
          if (task.isActive) {
            // Check if task has expired
            if (task.endTime <= now) {
              console.log(`Scheduled task expired: ${task.name}`);
              get().updateScheduledTask(task.id, { isActive: false });
              return;
            }

            // Check if max executions reached
            if (
              task.maxExecutions &&
              task.executionCount >= task.maxExecutions
            ) {
              console.log(
                `Scheduled task max executions reached: ${task.name}`,
              );
              get().updateScheduledTask(task.id, { isActive: false });
              return;
            }

            console.log(
              `Restoring timers for active scheduled task: ${task.name}`,
            );
            // Reactivate the task to restore timers
            get().updateScheduledTask(task.id, { isActive: false });

            // Small delay to ensure state update, then reactivate
            setTimeout(() => {
              get().toggleScheduledTask(task.id);
            }, 100);
          }
        });
      },

      // AI Rule methods
      setProfileAttachedRule: (profile: string, rule: AiRule | null) => {
        set((state) => ({
          profileStates: {
            ...state.profileStates,
            [profile]: {
              ...state.profileStates[profile],
              attachedRule: rule,
            },
          },
        }));
      },

      setProfileRetrievingRule: (profile: string, isRetrieving: boolean) => {
        set((state) => ({
          profileStates: {
            ...state.profileStates,
            [profile]: {
              ...state.profileStates[profile],
              isRetrievingRule: isRetrieving,
            },
          },
        }));
      },

      setProfileRuleError: (profile: string, error: string | null) => {
        set((state) => ({
          profileStates: {
            ...state.profileStates,
            [profile]: {
              ...state.profileStates[profile],
              ruleError: error,
            },
          },
        }));
      },

      clearProfileAttachedRule: (profile: string) => {
        set((state) => ({
          profileStates: {
            ...state.profileStates,
            [profile]: {
              ...state.profileStates[profile],
              attachedRule: null,
              isRetrievingRule: false,
              ruleError: null,
            },
          },
        }));
      },
    }),
    {
      name: "automation-storage",
      // Only persist essential data, not runtime state
      partialize: (state) => ({
        activeProfile: state.activeProfile,
        selectedProfiles: state.selectedProfiles,
        allAvailableProfiles: state.allAvailableProfiles,
        promptHistory: state.promptHistory,
        savedPrompts: state.savedPrompts,
        sidebarCollapsed: state.sidebarCollapsed,
        scheduledTasks: state.scheduledTasks,
      }),
    },
  ),
);
