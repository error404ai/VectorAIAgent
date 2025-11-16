import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProfileState {
  // Profile management state
  newProfileName: string;
  isCreatingProfile: boolean;
  // Name of the profile currently being deleted (null when none). Use this to
  // track per-profile deletion so UI can show "Deleting..." for only the
  // specific profile instead of a global boolean that affects all buttons.
  // (legacy single-delete removed) - use deletingProfileNames instead
  isDeletingAllProfiles: boolean;
  profileError: string | null;
  isRefreshingProfiles: boolean;
  profileRefreshError: string | null;

  // Browser status for profile operations
  browserStatus: {
    status: "idle" | "opening" | "open" | "error";
    message?: string;
  };

  // Name of the profile currently being opened (null when none).
  // This allows the UI to show "Opening..." only for the specific
  // profile that was clicked, rather than a global opening state which
  // would affect all profile buttons.
  // Support multiple concurrent openings (array of profile names)
  openingProfileNames: string[];
  // Profiles selected in the UI for bulk operations (open/delete)
  selectedProfiles: string[];
  // Profiles currently being deleted (supports multiple concurrent deletions)
  deletingProfileNames: string[];

  // Chromium management state
  chromiumStatus: {
    isInstalled: boolean;
    version?: string;
    installPath?: string;
    lastChecked?: Date; // undefined means status never checked from DB or manually
  };
  chromiumOperation: {
    status:
      | "idle"
      | "checking"
      | "installing"
      | "uninstalling"
      | "success"
      | "error";
    message?: string;
    progress?: number;
  };

  // Profile management actions
  setNewProfileName: (name: string) => void;
  setIsCreatingProfile: (val: boolean) => void;
  setIsDeletingAllProfiles: (val: boolean) => void;
  setProfileError: (err: string | null) => void;
  setIsRefreshingProfiles: (val: boolean) => void;
  setProfileRefreshError: (err: string | null) => void;
  setBrowserStatus: (status: ProfileState["browserStatus"]) => void;
  setOpeningProfileNames: (names: string[]) => void;
  setSelectedProfiles: (names: string[]) => void;
  setDeletingProfileNames: (names: string[]) => void;

  // Chromium management actions
  setChromiumStatus: (status: ProfileState["chromiumStatus"]) => void;
  setChromiumOperation: (operation: ProfileState["chromiumOperation"]) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      // Profile management initial state
      newProfileName: "",
      isCreatingProfile: false,
      // legacy single delete removed
      isDeletingAllProfiles: false,
      profileError: null,
      isRefreshingProfiles: false,
      profileRefreshError: null,

      // Browser status initial state
      browserStatus: { status: "idle" },
      // No profiles are opening initially
      openingProfileNames: [],
      // No profiles selected initially
      selectedProfiles: [],
      // No profiles are being deleted initially
      deletingProfileNames: [],

      // Chromium management initial state
      chromiumStatus: {
        isInstalled: false,
        lastChecked: undefined, // Explicitly undefined to indicate not checked
      },
      chromiumOperation: {
        status: "idle",
      },

      // Profile management actions
      setNewProfileName: (newProfileName) => set({ newProfileName }),
      setIsCreatingProfile: (isCreatingProfile) => set({ isCreatingProfile }),
      // Legacy single-delete setter removed; use setDeletingProfileNames instead.
      setIsDeletingAllProfiles: (isDeletingAllProfiles) =>
        set({ isDeletingAllProfiles }),
      setProfileError: (profileError) => set({ profileError }),
      setIsRefreshingProfiles: (isRefreshingProfiles) =>
        set({ isRefreshingProfiles }),
      setProfileRefreshError: (profileRefreshError) =>
        set({ profileRefreshError }),
      setBrowserStatus: (browserStatus) => set({ browserStatus }),
      setOpeningProfileNames: (openingProfileNames) =>
        set({ openingProfileNames }),
      setSelectedProfiles: (selectedProfiles) => set({ selectedProfiles }),
      setDeletingProfileNames: (deletingProfileNames) =>
        set({ deletingProfileNames }),

      // Chromium management actions
      setChromiumStatus: (chromiumStatus) => set({ chromiumStatus }),
      setChromiumOperation: (chromiumOperation) => set({ chromiumOperation }),
    }),
    {
      name: "profile-storage",
      // Only persist the essential state, not UI state
      partialize: (state) => ({
        chromiumStatus: state.chromiumStatus,
      }),
    },
  ),
);
