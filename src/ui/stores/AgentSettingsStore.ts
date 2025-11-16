import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AgentSettingsState {
  waitBetweenActions: number; // seconds
  hasUnsavedChanges: boolean;
  setWaitBetweenActions: (val: number, hasUnsaved?: boolean) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  saveSettings: (payload: { waitBetweenActions: number }) => void;
}

export const useAgentSettingsStore = create<AgentSettingsState>()(
  persist(
    (set) => ({
      waitBetweenActions: 0.2,
      hasUnsavedChanges: false,
      setWaitBetweenActions: (val, hasUnsaved = true) =>
        set(() => ({ waitBetweenActions: val, hasUnsavedChanges: hasUnsaved })),
      setHasUnsavedChanges: (val) => set(() => ({ hasUnsavedChanges: val })),
      saveSettings: (payload) =>
        set(() => ({
          waitBetweenActions: payload.waitBetweenActions,
          hasUnsavedChanges: false,
        })),
    }),
    {
      name: "agent-settings-storage",
      partialize: (state) => ({
        waitBetweenActions: state.waitBetweenActions,
      }),
    },
  ),
);

export default useAgentSettingsStore;
