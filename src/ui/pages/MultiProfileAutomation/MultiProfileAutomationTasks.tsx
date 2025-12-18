import { Calendar, Check, Loader, Play, Square, Wand2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "../../components/Modal";
import PageTitle from "../../components/PageTitle";
import { useSearchAiRulesMutation } from "../../RTKService/aiRuleService";
import { useEnhancePromptMutation } from "../../RTKService/promptService";
import { useAISettingsStore } from "../../stores/AISettingsStore";
import {
  useAutomationStore,
  type PromptHistoryItem,
} from "../../stores/AutomationStore";
import { useBrowserSettingsStore } from "../../stores/BrowserSettingsStore";
import "./datepicker-overrides.css";

interface ProfileCheckboxProps {
  profile: string;
  isSelected: boolean;
  isRunning: boolean;
  isQueued?: boolean;
  // forward mouse event so parent can support shift-select
  onToggle: (profile: string, e?: React.MouseEvent) => void;
}

const ProfileCheckbox: React.FC<ProfileCheckboxProps> = ({
  profile,
  isSelected,
  isRunning,
  isQueued,
  onToggle,
}) => {
  return (
    <label
      className="flex cursor-pointer items-center gap-2 border border-white/10 bg-black/30 p-1 transition-all hover:bg-black/40"
      onClick={(e) => {
        e.preventDefault();
        onToggle(profile, e);
      }}
    >
      <div className="relative">
        <input type="checkbox" checked={isSelected} className="sr-only" />
        <div
          className={`flex h-4 w-4 items-center justify-center border transition-all ${
            isSelected
              ? "border-blue-500 bg-blue-500"
              : "border-white/30 bg-transparent"
          } ${isRunning ? "opacity-50" : ""}`}
        >
          {isSelected && <Check size={10} className="text-white" />}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">
          {profile}
        </span>
        {isRunning ? (
          <div className="mt-0 flex items-center gap-1">
            <div className="h-1 w-1 animate-pulse bg-orange-400"></div>
            <span className="text-xs text-orange-400">Running</span>
          </div>
        ) : isQueued ? (
          <div className="mt-0 flex items-center gap-1">
            <div className="h-1 w-1 bg-yellow-400"></div>
            <span className="text-xs text-yellow-400">Queued</span>
          </div>
        ) : null}
      </div>
    </label>
  );
};

function MultiProfileAutomationTasks() {
  const {
    selectedProfiles,
    setSelectedProfiles,
    allAvailableProfiles,
    setAllAvailableProfiles,
    startTasksForMultipleProfiles,
    stopTasksForProfiles,
    getProfileState,
    clearScheduledStarts,
    cancelScheduledStartsForProfiles,
    isProfileQueued,
    promptHistory,
    setProfileAttachedRule,
    clearProfileAttachedRule,
  } = useAutomationStore();

  // helper to know if any running or queued tasks exist globally
  const anyRunningOrQueued = useAutomationStore((s) =>
    s.hasAnyRunningOrQueuedTasks(),
  );

  const { activeProvider, configs } = useAISettingsStore();
  const modelConfig = configs[activeProvider];

  // Mutation hook to enhance prompt
  const [enhancePrompt, { isLoading: isEnhancingLoading }] =
    useEnhancePromptMutation();

  // Mutation hook to search AI rules
  const [searchAiRules, { isLoading: isSearchingRules }] =
    useSearchAiRulesMutation();

  // Use react-datepicker directly for picking date/time. The package must be
  // installed in the project for this to work.

  const [isLoading, setIsLoading] = useState(true);
  const [localPrompt, setLocalPrompt] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState<number>(5);
  const [operationStatus, setOperationStatus] = useState<{
    status: "idle" | "saving" | "saved" | "error";
    message?: string;
  }>({ status: "idle" });

  // Scheduling UI state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    // use Date objects for the datepicker — default to current date/time
    startTime: new Date() as Date | null,
    endTime: new Date() as Date | null,
    intervalMinutes: 60,
    maxExecutions: "",
  });

  // Load available profiles from store
  const loadProfilesFromStore = useCallback(async () => {
    try {
      setIsLoading(true);
      const browserSettings = useBrowserSettingsStore.getState().settings;

      const currentBrowserProfiles = browserSettings.availableProfiles || [
        "default_profile",
      ];

      setAllAvailableProfiles(currentBrowserProfiles);
      setSelectedProfiles([]);

      console.log("Loaded profiles for multi-profile automation:", {
        currentBrowserProfiles,
        selectedProfiles: [],
      });
    } catch (error) {
      console.error("Error loading profiles:", error);
      setAllAvailableProfiles(["default_profile"]);
      setSelectedProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [setAllAvailableProfiles, setSelectedProfiles]);

  useEffect(() => {
    // AI settings are already loaded via Zustand persist
    // No need to load from database
  }, []);

  useEffect(() => {
    loadProfilesFromStore();
  }, [loadProfilesFromStore]);

  // index of the last clicked profile for shift-select
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

  const handleProfileToggleWithEvent = (
    profile: string,
    e?: React.MouseEvent,
  ) => {
    // Get current profiles order
    const profiles = allAvailableProfiles;
    const index = profiles.indexOf(profile);

    // If shift key is held and we have a lastSelectedIndex, select range
    if (e?.shiftKey && lastSelectedIndex !== null && lastSelectedIndex >= 0) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const range = profiles.slice(start, end + 1);

      // Merge with existing selectedProfiles
      const newSelected = Array.from(new Set([...selectedProfiles, ...range]));
      setSelectedProfiles(newSelected);
      setLastSelectedIndex(index);
      return;
    }

    // No shift: toggle single profile
    const isSelected = selectedProfiles.includes(profile);
    if (isSelected) {
      setSelectedProfiles(selectedProfiles.filter((p) => p !== profile));
    } else {
      setSelectedProfiles([...selectedProfiles, profile]);
    }
    setLastSelectedIndex(index);
  };

  const handleSelectAll = () => {
    if (selectedProfiles.length === allAvailableProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles([...allAvailableProfiles]);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!localPrompt.trim()) {
      return;
    }

    try {
      const response = await enhancePrompt({ prompt: localPrompt }).unwrap();
      setLocalPrompt(response.enhancedPrompt);
    } catch (error) {
      console.error("Enhance prompt error:", error);
    }
  };

  const handleStartTasks = async () => {
    if (!localPrompt.trim()) {
      setOperationStatus({
        status: "error",
        message: "Please enter a prompt before starting automation",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
      return;
    }

    if (selectedProfiles.length === 0) {
      setOperationStatus({
        status: "error",
        message: "Please select at least one profile to run automation on",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
      return;
    }

    // Filter profiles: only those not running and not queued
    const targetProfiles = selectedProfiles.filter((p) => {
      const ps = getProfileState(p);
      const running = ps.currentTask?.isRunning;
      const queued = isProfileQueued(p);
      return !running && !queued; // only start fresh ones
    });

    if (targetProfiles.length === 0) {
      setOperationStatus({
        status: "error",
        message: "Selected profiles are already running or queued",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
      return;
    }

    const RULE_SIMILARITY_THRESHOLD = parseFloat(
      import.meta.env.VITE_RULE_SIMILARITY_THRESHOLD || "0.5",
    );

    // Clear any previous attached rules for target profiles
    targetProfiles.forEach((profile) => {
      clearProfileAttachedRule(profile);
    });

    let enhancedPrompt = localPrompt.trim();
    try {
      setOperationStatus({
        status: "saving",
        message: "Searching for AI rules...",
      });

      const ruleResponse = await searchAiRules({
        prompt: localPrompt.trim(),
        limit: 1,
      }).unwrap();

      if (ruleResponse.data && ruleResponse.data.length > 0) {
        const topRule = ruleResponse.data[0];

        if (
          topRule.similarity_score &&
          topRule.similarity_score >= RULE_SIMILARITY_THRESHOLD
        ) {
          // Attach the rule to all target profiles
          targetProfiles.forEach((profile) => {
            setProfileAttachedRule(profile, topRule);
          });

          setOperationStatus({
            status: "saving",
            message: `Found matching rule: "${topRule.name}" (${(topRule.similarity_score * 100).toFixed(1)}% similarity)`,
          });

          // Enhance the prompt with the rule
          enhancedPrompt = `${topRule.rule}\n\nOriginal task: ${localPrompt.trim()}`;
        } else {
          setOperationStatus({
            status: "saving",
            message: `Rule found but similarity too low (${(topRule.similarity_score || 0) * 100}%)`,
          });
        }
      } else {
        setOperationStatus({
          status: "saving",
          message: "No matching AI rules found",
        });
      }
    } catch (error) {
      console.error("Failed to retrieve AI rules:", error);
      setOperationStatus({
        status: "saving",
        message: "Failed to search AI rules, proceeding without rules",
      });
    }

    try {
      setIsStarting(true);
      setOperationStatus({
        status: "saving",
        message: "Starting automation...",
      });

      // convert seconds -> ms and pass to store
      const delayMs = Math.max(0, Math.round(delaySeconds * 1000));
      await startTasksForMultipleProfiles(
        targetProfiles,
        enhancedPrompt,
        delayMs,
      );

      setOperationStatus({
        status: "saved",
        message: `Started automation on ${targetProfiles.length} profile(s)`,
      });

      // Ensure UI selection is cleared; do it twice (immediate + short timeout)
      setSelectedProfiles([]);
      setTimeout(() => setSelectedProfiles([]), 50);

      setLocalPrompt("");
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
    } catch (error: unknown) {
      console.error("Error starting multi-profile automation:", error);
      setOperationStatus({
        status: "error",
        message: `Failed to start automation: ${(error as Error).message}`,
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 5000);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopTasks = async () => {
    // Immediately clear UI selection so profiles appear deselected when Stop is clicked
    const selected = selectedProfiles;
    setSelectedProfiles([]);
    const allProfiles = allAvailableProfiles;

    // Profiles with running tasks among selected
    const selectedRunning = selected.filter(
      (p) => getProfileState(p).currentTask?.isRunning,
    );
    // Profiles queued among selected
    const selectedQueued = selected.filter((p) => isProfileQueued(p));

    const anySelected = selected.length > 0;
    const stoppingAll = !anySelected || selected.length === allProfiles.length; // no selection => stop all

    try {
      if (stoppingAll) {
        // Cancel all queued & stop all running
        clearScheduledStarts();
        const runningAll = allProfiles.filter(
          (p) => getProfileState(p).currentTask?.isRunning,
        );
        if (runningAll.length > 0) {
          await stopTasksForProfiles(runningAll);
        }
        setOperationStatus({
          status: "saved",
          message: `Stopped all running & queued tasks`,
        });
        setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
        return;
      }

      // Cancel queued starts only for selected queued profiles
      if (selectedQueued.length > 0) {
        cancelScheduledStartsForProfiles(selectedQueued);
      }

      if (selectedRunning.length > 0) {
        await stopTasksForProfiles(selectedRunning);
      }

      if (selectedRunning.length === 0 && selectedQueued.length === 0) {
        setOperationStatus({
          status: "error",
          message: "Selected profiles have no running or queued tasks",
        });
        setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
        return;
      }

      setOperationStatus({
        status: "saved",
        message: `Stopped ${selectedRunning.length} running${selectedQueued.length ? ` & cancelled ${selectedQueued.length} queued` : ""}`,
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
    } catch (error) {
      console.error("Error stopping tasks:", error);
      setOperationStatus({
        status: "error",
        message: "Failed to stop some tasks",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
    }
  };

  const getRunningSelectedProfilesCount = () => {
    return selectedProfiles.filter((profile) => {
      const profileState = getProfileState(profile);
      return profileState.currentTask?.isRunning;
    }).length;
  };

  // Scheduling handlers
  const handleScheduleTask = () => {
    if (!localPrompt.trim()) {
      setOperationStatus({
        status: "error",
        message: "Please enter a prompt before scheduling",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
      return;
    }

    if (selectedProfiles.length === 0) {
      setOperationStatus({
        status: "error",
        message: "Please select at least one profile to schedule",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
      return;
    }

    setScheduleForm({
      name: `Auto: ${localPrompt.slice(0, 30)}${localPrompt.length > 30 ? "..." : ""}`,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      intervalMinutes: 60,
      maxExecutions: "",
    });
    setShowScheduleModal(true);
  };

  const handleCreateScheduledTask = () => {
    const { createScheduledTask } = useAutomationStore.getState();

    if (
      !scheduleForm.name.trim() ||
      !scheduleForm.startTime ||
      !scheduleForm.endTime
    ) {
      setOperationStatus({
        status: "error",
        message: "Please fill in all required fields",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
      return;
    }

    const startTime = scheduleForm.startTime as Date | null;
    const endTime = scheduleForm.endTime as Date | null;

    if (!startTime || !endTime) {
      setOperationStatus({
        status: "error",
        message: "Invalid start or end time",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
      return;
    }

    if (startTime >= endTime) {
      setOperationStatus({
        status: "error",
        message: "End time must be after start time",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
      return;
    }

    if (endTime <= new Date()) {
      setOperationStatus({
        status: "error",
        message: "End time must be in the future",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
      return;
    }

    try {
      const maxExecutions = scheduleForm.maxExecutions
        ? parseInt(scheduleForm.maxExecutions, 10)
        : undefined;

      // createScheduledTask expects Date objects; pass through directly
      createScheduledTask(
        scheduleForm.name,
        localPrompt.trim(),
        selectedProfiles,
        startTime,
        endTime,
        scheduleForm.intervalMinutes,
        maxExecutions,
      );

      setOperationStatus({
        status: "saved",
        message: "Scheduled task created successfully",
      });

      setShowScheduleModal(false);
      setLocalPrompt("");
      setSelectedProfiles([]);
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
    } catch (error) {
      console.error("Error creating scheduled task:", error);
      setOperationStatus({
        status: "error",
        message: "Failed to create scheduled task",
      });
      setTimeout(() => setOperationStatus({ status: "idle" }), 3000);
    }
  };

  const hasRunningTasks = getRunningSelectedProfilesCount() > 0;

  if (isLoading) {
    return (
      <div className="relative flex h-full w-full flex-col select-none">
        <PageTitle title="Multi-Profile Automation">
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

  return (
    <div className="relative flex h-full w-full flex-col select-none">
      <PageTitle title="Multi-Profile Automation" savedStatus={operationStatus}>
        {hasRunningTasks && (
          <div className="flex items-center gap-2 bg-orange-400/20 px-3 py-1">
            <div className="h-2 w-2 animate-pulse bg-orange-400"></div>
            <span className="text-sm font-medium text-orange-400">
              {getRunningSelectedProfilesCount()} task
              {getRunningSelectedProfilesCount() !== 1 ? "s" : ""} running
            </span>
          </div>
        )}
        {modelConfig.apiKey ? (
          <span className="text-sm text-white/70">
            🤖 {modelConfig.provider} - {modelConfig.model}
          </span>
        ) : (
          <span className="text-sm text-yellow-400">
            ⚠️ No API key configured
          </span>
        )}
        {selectedProfiles.some(
          (profile) => getProfileState(profile).attachedRule,
        ) && (
          <div className="flex items-center gap-1 rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
            <span>📋</span>
            <span>AI Rule</span>
          </div>
        )}
      </PageTitle>

      <div className="max-h-[calc(100vh-140px)] flex-1 overflow-auto p-4">
        <div className="mb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-white">
                Profile Selection
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-white/50">
                Selected: {selectedProfiles.length}/
                {allAvailableProfiles.length}
              </div>
              <button
                onClick={handleSelectAll}
                disabled={isStarting}
                className={`bg-[#091E38]/60 px-2 py-1 text-center text-sm text-gray-200 transition-all hover:bg-[#091E38] ${isStarting ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {selectedProfiles.length === allAvailableProfiles.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          </div>
          <div className="mt-0.5 text-sm text-white/50">
            Choose profiles to run automation tasks simultaneously
          </div>
        </div>

        {/* Profile selection grid - more compact */}
        <div className="mb-3 grid max-h-28 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3 lg:grid-cols-4">
          {allAvailableProfiles.map((profile) => {
            const profileState = getProfileState(profile);
            const isRunning = profileState.currentTask?.isRunning || false;
            const queued = isProfileQueued(profile);

            return (
              <ProfileCheckbox
                key={profile}
                profile={profile}
                isSelected={selectedProfiles.includes(profile)}
                isRunning={isRunning}
                isQueued={queued}
                onToggle={handleProfileToggleWithEvent}
              />
            );
          })}
        </div>

        {/* Prompt input section - reduced spacing */}
        <div className="mb-3">
          <div className="mb-2">
            <span className="text-lg font-medium text-white">
              Automation Prompt
            </span>
            <div className="mt-1 text-sm text-white/50">
              Enter the task you want to run on all selected profiles
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isStarting && !isSearchingRules) {
                handleStartTasks();
              }
            }}
            className="flex gap-2 space-y-2"
          >
            <div className="relative grow">
              <textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                className="h-20 w-full resize-none border border-white/20 bg-black/40 p-2 pr-10 text-sm text-white placeholder-white/50 focus:border-blue-500 focus:outline-none"
                placeholder="Enter your automation prompt here (e.g. 'Post a tweet about my latest project')"
                disabled={isStarting || isSearchingRules}
              />
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancingLoading || !localPrompt.trim()}
                className="absolute top-0 right-0 bg-blue-600/20 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600/30 disabled:opacity-40"
              >
                {isEnhancingLoading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Wand2 size={16} />
                )}
              </button>
            </div>

            {/* Compact delay input */}
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-xs text-nowrap text-white/70">
                  Delay (seconds):
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="300"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value) || 0)}
                className="w-16 border border-white/20 bg-black/40 px-2 py-1 text-sm text-white focus:border-blue-500"
                disabled={isStarting}
              />
            </div>

            <div className="flex flex-col gap-2">
              {anyRunningOrQueued && (
                <button
                  type="button"
                  onClick={handleStopTasks}
                  className="bg-red-600 px-2 py-1 text-sm text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Square size={14} className="mr-1 inline" />
                  <span className="text-sm">Stop All</span>
                </button>
              )}

              <button
                type="submit"
                disabled={
                  isStarting ||
                  isSearchingRules ||
                  !localPrompt.trim() ||
                  selectedProfiles.length === 0
                }
                className="flex items-center gap-2 bg-blue-600 px-2 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSearchingRules ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-transparent border-t-blue-300"></div>
                    <span className="text-sm">Searching Rules...</span>
                  </>
                ) : isStarting ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-transparent border-t-white"></div>
                    <span className="text-sm">Starting...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span className="text-sm">Start Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleScheduleTask}
                disabled={
                  isStarting ||
                  !localPrompt.trim() ||
                  selectedProfiles.length === 0
                }
                className="flex items-center gap-2 bg-blue-600 px-2 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Calendar size={14} />
                <span className="text-sm">Schedule</span>
              </button>
            </div>
          </form>
        </div>

        {/* Prompt History - Original Design */}
        <div className="border border-blue-500/20 bg-blue-500/10 p-1">
          {promptHistory.length === 0 ? (
            <p className="text-center text-sm text-blue-200/60">
              Recent prompts will appear here
            </p>
          ) : (
            <div className="max-h-28 space-y-1 overflow-y-auto">
              {promptHistory.slice(0, 10).map((item: PromptHistoryItem) => (
                <button
                  key={item.id}
                  onClick={() => setLocalPrompt(item.prompt)}
                  className="block w-full border border-blue-400/20 bg-black/20 px-2 py-0.5 text-left text-sm text-blue-200/80 transition-colors hover:border-blue-400/40 hover:bg-blue-500/20 hover:text-blue-200"
                  title={item.prompt}
                >
                  <div className="truncate">{item.prompt}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Task"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Task Name
            </label>
            <input
              type="text"
              value={scheduleForm.name}
              onChange={(e) =>
                setScheduleForm({ ...scheduleForm, name: e.target.value })
              }
              className="w-full border border-white/20 bg-black/40 px-2 py-1 text-sm text-white focus:border-blue-500"
              placeholder="My scheduled task"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Start Time
            </label>
            <div className="relative">
              <DatePicker
                selected={scheduleForm.startTime}
                onChange={(d: Date | null) =>
                  setScheduleForm({ ...scheduleForm, startTime: d })
                }
                showTimeSelect
                /* use 12-hour time with am/pm */
                timeFormat="h:mm aa"
                timeIntervals={5}
                dateFormat="yyyy-MM-dd h:mm aa"
                className="w-full rounded-none! border border-white/20 bg-black/40 px-2 py-1 text-sm text-white focus:border-blue-500"
                placeholderText="Select start time"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">End Time</label>
            <div className="relative">
              <DatePicker
                selected={scheduleForm.endTime}
                onChange={(d: Date | null) =>
                  setScheduleForm({ ...scheduleForm, endTime: d })
                }
                showTimeSelect
                /* use 12-hour time with am/pm */
                timeFormat="h:mm aa"
                timeIntervals={5}
                dateFormat="yyyy-MM-dd h:mm aa"
                className="w-full rounded-none! border border-white/20 bg-black/40 px-2 py-1 text-sm text-white focus:border-blue-500"
                placeholderText="Select end time"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Repeat Interval (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={scheduleForm.intervalMinutes}
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  intervalMinutes: parseInt(e.target.value) || 1,
                })
              }
              className="w-full border border-white/20 bg-black/40 px-2 py-1 text-sm text-white focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Max Executions (optional)
            </label>
            <input
              type="number"
              min="1"
              value={scheduleForm.maxExecutions}
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  maxExecutions: e.target.value,
                })
              }
              className="w-full border border-white/20 bg-black/40 px-2 py-1 text-sm text-white focus:border-blue-500"
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div className="text-xs text-white/50">
            <p>Selected Profiles: {selectedProfiles.join(", ")}</p>
            <p>Task: {localPrompt}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setShowScheduleModal(false)}
            className="bg-red-600 px-2 py-1 text-sm text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateScheduledTask}
            className="bg-blue-500 px-2 py-1 text-sm text-white transition-colors hover:bg-blue-600 disabled:bg-gray-600 disabled:opacity-50"
          >
            Create Schedule
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default MultiProfileAutomationTasks;
