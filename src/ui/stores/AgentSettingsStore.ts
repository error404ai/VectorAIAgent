import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AgentSettingsState {
  waitBetweenActions: number; // seconds
  enableAIRules: boolean;
  hasUnsavedChanges: boolean;
  setWaitBetweenActions: (val: number, hasUnsaved?: boolean) => void;
  setEnableAIRules: (val: boolean, hasUnsaved?: boolean) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  saveSettings: (payload: {
    waitBetweenActions: number;
    enableAIRules: boolean;
  }) => void;
}

export const useAgentSettingsStore = create<AgentSettingsState>()(
  persist(
    (set) => ({
      waitBetweenActions: 0.2,
      enableAIRules: true,
      hasUnsavedChanges: false,
      setWaitBetweenActions: (val, hasUnsaved = true) =>
        set(() => ({ waitBetweenActions: val, hasUnsavedChanges: hasUnsaved })),
      setEnableAIRules: (val, hasUnsaved = true) =>
        set(() => ({ enableAIRules: val, hasUnsavedChanges: hasUnsaved })),
      setHasUnsavedChanges: (val) => set(() => ({ hasUnsavedChanges: val })),
      saveSettings: (payload) =>
        set(() => ({
          waitBetweenActions: payload.waitBetweenActions,
          enableAIRules: payload.enableAIRules,
          hasUnsavedChanges: false,
        })),
    }),
    {
      name: "agent-settings-storage",
      partialize: (state) => ({
        waitBetweenActions: state.waitBetweenActions,
        enableAIRules: state.enableAIRules,
      }),
    },
  ),
);

export default useAgentSettingsStore;
