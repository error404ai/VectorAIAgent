import { Download, LoaderCircle, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import type { Window } from "../../../types/global-types";
import PageTitle from "../components/PageTitle";
import BrowserSettingsService from "../services/BrowserSettingsService";
import { useBrowserSettingsStore } from "../stores/BrowserSettingsStore";
import { useProfileStore } from "../stores/ProfileStore";

function ProfileManagement() {
  const { settings, setSettings } = useBrowserSettingsStore();
  const {
    newProfileName,
    isCreatingProfile,
    // deletingProfileName is no longer used; bulk delete is handled globally
    isDeletingAllProfiles,
    profileError,
    isRefreshingProfiles,
    profileRefreshError,
    browserStatus,
    chromiumStatus,
    chromiumOperation,
    setNewProfileName,
    setIsCreatingProfile,
    setIsDeletingAllProfiles,
    setProfileError,
    setIsRefreshingProfiles,
    setProfileRefreshError,
    setBrowserStatus,
    openingProfileNames,
    setOpeningProfileNames,
    selectedProfiles,
    setSelectedProfiles,
    setChromiumStatus,
    setChromiumOperation,
    deletingProfileNames,
    setDeletingProfileNames,
  } = useProfileStore();
  // Get current browser profiles based on browser selection
  const getCurrentBrowserProfiles = (): string[] => {
    // Use browser profiles if available
    if (settings.browserProfiles) {
      if (settings.useSystemBrowser) {
        // For system browser, match by exact browser_path
        const systemPath = settings.systemBrowserPath || "";
        for (const browserInfo of Object.values(settings.browserProfiles)) {
          if (browserInfo.browser_path === systemPath) {
            return browserInfo.profiles;
          }
        }
      } else {
        // For Chromium browser, prioritize built-in chromium first
        // First try to find built-in chromium
        for (const browserInfo of Object.values(settings.browserProfiles)) {
          if (browserInfo.browser_name === "builtin_chromium") {
            return browserInfo.profiles;
          }
        }

        // If no built-in chromium found and we have a chromium install path, match by that
        if (settings.chromiumInstallPath) {
          for (const browserInfo of Object.values(settings.browserProfiles)) {
            if (browserInfo.browser_path === settings.chromiumInstallPath) {
              return browserInfo.profiles;
            }
          }
        }
      }
    }

    // Fallback to availableProfiles or default profile if no match found
    const currentProfiles = settings.availableProfiles || ["default_profile"];
    return currentProfiles.length > 0 ? currentProfiles : ["default_profile"];
  };

  // Function to create a new profile
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setProfileError("Profile name cannot be empty");
      return;
    }

    // Sanitize profile name (alphanumeric and underscore only)
    const sanitizedName = newProfileName.replace(/[^a-zA-Z0-9_]/g, "_");
    if (sanitizedName !== newProfileName) {
      console.log(`Profile name sanitized to: ${sanitizedName}`);
    }

    setProfileError(null);
    setIsCreatingProfile(true);
    console.log(`Creating browser profile: ${sanitizedName}...`);

    try {
      const electronAPI = (window as unknown as Window).electronAPI;

      // Determine the correct browser path based on selection
      let browserPath = "";
      if (settings.useSystemBrowser) {
        // For system browser, use the system browser path
        browserPath = settings.systemBrowserPath || "";
      } else {
        // For chromium, use the chromium install path
        browserPath = settings.chromiumInstallPath || "";
      }

      console.log(
        `Browser selection - useSystemBrowser: ${settings.useSystemBrowser}`,
      );
      console.log(`System browser path: ${settings.systemBrowserPath}`);
      console.log(`Chromium install path: ${settings.chromiumInstallPath}`);
      console.log(`Using browser path: ${browserPath}`);

      if (!browserPath) {
        setProfileError(
          "Browser path is not configured. Please set the browser path first.",
        );
        return;
      }

      const result = await electronAPI.createBrowserProfile(
        sanitizedName,
        browserPath,
      );

      if (result.success) {
        console.log(`Created browser profile: ${sanitizedName}`);

        // Clear input field first
        setNewProfileName("");

        // Refresh the profile list to get updated structure from backend
        try {
          console.log(`Refreshing profile list...`);
          const refreshResult =
            await BrowserSettingsService.refreshProfilesFromBackend();

          if (refreshResult.success) {
            console.log(`Profile list updated after creation`);

            // Auto-save the settings to persist the new profile immediately
            try {
              const electronAPI = (window as unknown as Window).electronAPI;
              await electronAPI.saveBrowserSettings(
                useBrowserSettingsStore.getState().settings,
              );
              console.log("Auto-saved settings after profile creation");
            } catch (saveErr) {
              console.error(
                "Failed to auto-save settings after profile creation:",
                saveErr,
              );
            }
          } else {
            // Fallback: update local state manually if refresh fails
            const currentProfiles = settings.availableProfiles || [
              "default_profile",
            ];
            const updatedProfiles = [...currentProfiles, sanitizedName];
            setSettings({
              ...settings,
              availableProfiles: updatedProfiles,
              selectedProfile: sanitizedName,
            });
          }
        } catch (refreshErr) {
          console.error("Failed to refresh profile list:", refreshErr);
          // Fallback: update local state manually
          const currentProfiles = settings.availableProfiles || [
            "default_profile",
          ];
          const updatedProfiles = [...currentProfiles, sanitizedName];
          setSettings({
            ...settings,
            availableProfiles: updatedProfiles,
            selectedProfile: sanitizedName,
          });
        }
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setProfileError(`Failed to create profile: ${(err as Error).message}`);
      console.error(
        `Failed to create browser profile: ${(err as Error).message}`,
      );
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // Function to refresh profiles from backend
  const handleRefreshProfiles = async () => {
    setIsRefreshingProfiles(true);
    setProfileRefreshError(null);

    try {
      console.log("Manually fetching current browser profiles...");
      const result = await BrowserSettingsService.refreshProfilesFromBackend();

      if (result.success && result.profiles) {
        console.log("Updated browser profiles:", result.profiles);
        // Settings are automatically updated in the service
      } else {
        throw new Error(result.message || "Failed to refresh profiles");
      }
    } catch (error) {
      console.error("Error refreshing profiles:", error);
      setProfileRefreshError(
        `Failed to refresh profiles: ${(error as Error).message}`,
      );
    } finally {
      setIsRefreshingProfiles(false);
    }
  };

  // Toggle selection for a profile
  const toggleProfileSelection = (profile: string) => {
    const currently = selectedProfiles || [];
    if (currently.includes(profile)) {
      setSelectedProfiles(currently.filter((p) => p !== profile));
    } else {
      setSelectedProfiles([...currently, profile]);
    }
  };

  const [profileSearch, setProfileSearch] = useState("");

  const handleToggleSelectAll = () => {
    const all = getCurrentBrowserProfiles().filter((p) =>
      p.toLowerCase().includes(profileSearch.toLowerCase()),
    );
    const currently = selectedProfiles || [];
    if (currently.length === all.length && all.length > 0) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(all);
    }
  };

  const handleOpenMultipleProfiles = async (profiles: string[]) => {
    if (!profiles || profiles.length === 0) return;

    setBrowserStatus({ status: "opening" });

    const currentOpening = useProfileStore.getState().openingProfileNames || [];
    setOpeningProfileNames([...currentOpening, ...profiles]);

    for (const profileName of profiles) {
      try {
        const url = settings.defaultUrl || "https://www.google.com";
        const electronAPI = (window as unknown as Window).electronAPI;
        const result = await electronAPI.openBrowserWithProfile(
          url,
          profileName,
          settings.useSystemBrowser,
          settings.useSystemBrowser
            ? settings.systemBrowserPath
            : settings.chromiumInstallPath,
        );

        if (result.success) {
          setBrowserStatus({
            status: "open",
            message: `Browser opened with profile "${profileName}" at: ${url}`,
          });
        } else {
          setBrowserStatus({
            status: "error",
            message: result.message || `Failed to open ${profileName}`,
          });
        }
      } catch (err) {
        console.error("Failed to open profile:", profileName, err);
        setBrowserStatus({
          status: "error",
          message: `Failed to open ${profileName}: ${(err as Error).message}`,
        });
      } finally {
        // Remove this profile from opening list after a minimum display time so users notice the loading state
        setTimeout(() => {
          const liveOpening =
            useProfileStore.getState().openingProfileNames || [];
          setOpeningProfileNames(liveOpening.filter((p) => p !== profileName));
        }, 3000);
      }
    }

    // Clear overall opening status after a short delay (match per-profile minimum)
    setTimeout(() => setBrowserStatus({ status: "idle" }), 3000);
  };

  // Handler for Open button (selected or all)
  const handleOpenSelectedOrAll = async () => {
    const profilesToOpen =
      selectedProfiles && selectedProfiles.length > 0
        ? selectedProfiles
        : getCurrentBrowserProfiles();

    await handleOpenMultipleProfiles(profilesToOpen);
  };

  // Handler to delete selected profiles (or all if none selected)
  const handleDeleteSelectedOrAll = async () => {
    const profilesToDelete =
      selectedProfiles && selectedProfiles.length > 0
        ? selectedProfiles
        : undefined; // undefined signals delete all

    if (!profilesToDelete) {
      // No selection -> delete all
      await handleDeleteAllProfiles();
      return;
    }

    // Remove default_profile if included and warn
    if (
      profilesToDelete.includes("default_profile") &&
      profilesToDelete.length === 1
    ) {
      setProfileError("Cannot delete the default profile");
      setTimeout(() => setProfileError(null), 3000);
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${profilesToDelete.length} selected profile(s)? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeletingAllProfiles(true);
    setProfileError(null);

    try {
      const electronAPI = (window as unknown as Window).electronAPI;

      // Mark all targeted profiles as deleting so UI shows per-profile state
      setDeletingProfileNames(profilesToDelete);

      for (const profile of profilesToDelete) {
        if (profile === "default_profile") continue; // skip

        const browserPath = settings.useSystemBrowser
          ? settings.systemBrowserPath || ""
          : settings.chromiumInstallPath || "";

        const result = await electronAPI.deleteBrowserProfile(
          profile,
          browserPath,
        );

        if (!result.success) {
          // stop and surface error; keep deleting indicators visible for at least 3s
          setTimeout(() => setDeletingProfileNames([]), 3000);
          throw new Error(result.message || `Failed to delete ${profile}`);
        }
      }

      // Refresh profiles after deletion
      const refreshResult =
        await BrowserSettingsService.refreshProfilesFromBackend();
      if (!refreshResult.success) {
        // Fallback update local settings
        const currentProfiles = settings.availableProfiles || [
          "default_profile",
        ];
        const updatedProfiles = currentProfiles.filter(
          (p) => !profilesToDelete.includes(p),
        );
        const currentSelected = settings.selectedProfile || "default_profile";
        const newSelectedProfile = profilesToDelete.includes(currentSelected)
          ? "default_profile"
          : currentSelected;

        setSettings({
          ...settings,
          availableProfiles: updatedProfiles,
          selectedProfile: newSelectedProfile,
        });
      }

      setProfileError(
        `${profilesToDelete.length} profile(s) deleted successfully`,
      );
      setTimeout(() => setProfileError(null), 3000);
      // Clear selection
      setSelectedProfiles([]);
      // Clear per-profile deleting indicators after minimum visible time
      setTimeout(() => setDeletingProfileNames([]), 3000);
    } catch (err) {
      setProfileError(`Failed to delete profiles: ${(err as Error).message}`);
      setTimeout(() => setProfileError(null), 5000);
    } finally {
      setIsDeletingAllProfiles(false);
    }
  };

  // Function to delete all profiles
  const handleDeleteAllProfiles = async () => {
    // Confirm deletion
    if (
      !confirm(
        "Are you sure you want to delete ALL browser profiles? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeletingAllProfiles(true);
    setProfileError(null);

    try {
      // Mark all currently available profiles as deleting for UI
      const allProfiles = getCurrentBrowserProfiles();
      setDeletingProfileNames(allProfiles);

      const result = await BrowserSettingsService.deleteAllProfiles();

      if (result.success) {
        // Update local state to only have default profile
        setSettings({
          ...settings,
          availableProfiles: ["default_profile"],
          selectedProfile: "default_profile",
        });

        // Show success message
        setProfileError("All profiles deleted successfully");
        setTimeout(() => setProfileError(null), 3000);
        // Clear deleting indicators after minimum visible time
        setTimeout(() => setDeletingProfileNames([]), 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setProfileError(
        `Failed to delete all profiles: ${(err as Error).message}`,
      );
      setTimeout(() => setProfileError(null), 5000);
    } finally {
      setIsDeletingAllProfiles(false);
    }
  };

  // Single-profile open handler removed; bulk open is handled by
  // handleOpenMultipleProfiles / handleOpenSelectedOrAll.

  // Chromium management functions
  const handleCheckChromiumStatus = useCallback(async () => {
    setChromiumOperation({ status: "checking" });

    try {
      const electronAPI = (window as unknown as Window).electronAPI;
      const status = await electronAPI.checkChromiumStatus();
      const updatedStatus = {
        ...status,
        lastChecked: new Date(),
      };

      setChromiumStatus(updatedStatus);

      setChromiumOperation({
        status: "success",
        message: `Chromium is ${status.isInstalled ? "installed" : "not installed"}`,
      });

      setTimeout(() => {
        setChromiumOperation({ status: "idle" });
      }, 3000);
    } catch (error) {
      console.error("Failed to check Chromium status:", error);
      setChromiumOperation({
        status: "error",
        message: `Failed to check Chromium status: ${(error as Error).message}`,
      });

      setTimeout(() => {
        setChromiumOperation({ status: "idle" });
      }, 5000);
    }
  }, [setChromiumOperation, setChromiumStatus]);

  const handleInstallChromium = async () => {
    setChromiumOperation({
      status: "installing",
      message: "Installing Chromium browser...",
    });

    try {
      const electronAPI = (window as unknown as Window).electronAPI;
      const result = await electronAPI.installChromium();

      if (result.success) {
        // Update status after successful installation
        await handleCheckChromiumStatus();
        setChromiumOperation({
          status: "success",
          message: "Chromium installed successfully!",
          progress: 100,
        });
      } else {
        setChromiumOperation({
          status: "error",
          message: result.message || "Failed to install Chromium",
        });
      }

      setTimeout(() => {
        setChromiumOperation({ status: "idle" });
      }, 5000);
    } catch (error) {
      console.error("Failed to install Chromium:", error);
      setChromiumOperation({
        status: "error",
        message: `Failed to install Chromium: ${(error as Error).message}`,
      });

      setTimeout(() => {
        setChromiumOperation({ status: "idle" });
      }, 5000);
    }
  };

  const handleUninstallChromium = async () => {
    // Confirm uninstallation
    if (
      !confirm(
        "Are you sure you want to uninstall Chromium browser? This will remove the browser files but won't affect your browser profiles.",
      )
    ) {
      return;
    }

    setChromiumOperation({
      status: "uninstalling",
      message: "Uninstalling Chromium browser...",
    });

    try {
      const electronAPI = (window as unknown as Window).electronAPI;
      const result = await electronAPI.uninstallChromium();

      if (result.success) {
        // Update status after successful uninstallation
        const updatedStatus = {
          isInstalled: false,
          version: undefined,
          installPath: undefined,
          lastChecked: new Date(),
        };
        setChromiumStatus(updatedStatus);

        setChromiumOperation({
          status: "success",
          message: "Chromium uninstalled successfully!",
        });
      } else {
        setChromiumOperation({
          status: "error",
          message: result.message || "Failed to uninstall Chromium",
        });
      }

      setTimeout(() => {
        setChromiumOperation({ status: "idle" });
      }, 5000);
    } catch (error) {
      console.error("Failed to uninstall Chromium:", error);
      setChromiumOperation({
        status: "error",
        message: `Failed to uninstall Chromium: ${(error as Error).message}`,
      });

      setTimeout(() => {
        setChromiumOperation({ status: "idle" });
      }, 5000);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col select-none">
      <PageTitle title="Profile Management">
        <span className="text-sm text-white/70">
          Manage browser profiles for automation
        </span>
      </PageTitle>

      <div className="max-h-full flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-medium text-white">
            Browser Profiles
          </span>
          <span className="text-sm text-white/50">
            Create and manage browser profiles for different automation tasks
          </span>
        </div>

        <div className="flex gap-3">
          {/* Left Column - Browser Profile Management */}
          <div className="w-full">
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">
                  Profile Management
                </h3>
                <button
                  className="flex items-center gap-1 bg-white/10 px-2 py-1 text-xs text-white/80 transition-colors hover:bg-white/20 disabled:opacity-50"
                  onClick={handleRefreshProfiles}
                  disabled={isRefreshingProfiles}
                  title="Refresh available profiles"
                >
                  {isRefreshingProfiles ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <span>Refresh Profiles</span>
                  )}
                </button>
              </div>

              <div className="flex flex-col space-y-3">
                <div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white/80">
                        Available Profiles:
                      </h4>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={profileSearch}
                          onChange={(e) => setProfileSearch(e.target.value)}
                          placeholder="Search profiles..."
                          className="appearance-none rounded-none border border-white/10 bg-black/30 px-2 py-1 text-xs text-white placeholder-white/50 focus:outline-none"
                        />
                        <button
                          className="flex items-center gap-1 bg-white/10 px-2 py-1 text-xs text-white/80 transition-colors hover:bg-white/20 disabled:opacity-50"
                          onClick={handleToggleSelectAll}
                          title="Select or deselect all profiles"
                        >
                          {(selectedProfiles || []).length ===
                            getCurrentBrowserProfiles().filter((p) =>
                              p
                                .toLowerCase()
                                .includes(profileSearch.toLowerCase()),
                            ).length &&
                          getCurrentBrowserProfiles().filter((p) =>
                            p
                              .toLowerCase()
                              .includes(profileSearch.toLowerCase()),
                          ).length > 0
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>
                    </div>
                    <div className="max-h-58 space-y-1 overflow-y-auto pr-2">
                      {getCurrentBrowserProfiles()
                        .filter((p) =>
                          p.toLowerCase().includes(profileSearch.toLowerCase()),
                        )
                        .map((profile) => (
                          <div
                            key={profile}
                            className={`flex min-w-0 cursor-pointer items-center justify-between px-3 py-2 ${(selectedProfiles || []).includes(profile) ? "bg-black/20" : "bg-white/5"}`}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              // If the click originated from an interactive element (checkbox), ignore here
                              const target = e.target as HTMLElement;
                              if (target.tagName.toLowerCase() === "input")
                                return;
                              toggleProfileSelection(profile);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleProfileSelection(profile);
                              }
                            }}
                          >
                            <div className="mr-3 flex min-w-0 items-center gap-2">
                              <input
                                type="checkbox"
                                checked={(selectedProfiles || []).includes(
                                  profile,
                                )}
                                onChange={() => toggleProfileSelection(profile)}
                                title={`Select profile ${profile}`}
                                disabled={
                                  (openingProfileNames || []).includes(
                                    profile,
                                  ) ||
                                  (deletingProfileNames || []).includes(profile)
                                }
                              />
                              <span className="block truncate text-sm text-white/90 select-none">
                                {profile}
                              </span>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              {/* Per-profile indicators (deleting takes precedence) */}
                              {(deletingProfileNames || []).includes(
                                profile,
                              ) ? (
                                <span className="flex items-center gap-2 text-xs text-red-300">
                                  <LoaderCircle className="size-4 animate-spin" />
                                  Deleting...
                                </span>
                              ) : (openingProfileNames || []).includes(
                                  profile,
                                ) ? (
                                <span className="flex items-center gap-2 text-xs text-blue-300">
                                  <LoaderCircle className="size-4 animate-spin" />
                                  Opening...
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Bulk action buttons (Open / Delete) */}
                    <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
                      <button
                        className="flex items-center gap-2 bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600 disabled:bg-blue-400"
                        onClick={handleOpenSelectedOrAll}
                        disabled={(openingProfileNames || []).length > 0}
                        title="Open selected profiles (or all if none selected)"
                      >
                        {(openingProfileNames || []).length > 0 ? (
                          <>
                            <LoaderCircle className="size-4 animate-spin" />
                            <span>Opening...</span>
                          </>
                        ) : (
                          <span>
                            {(selectedProfiles || []).length > 0
                              ? `Open Selected (${(selectedProfiles || []).length})`
                              : `Open All`}
                          </span>
                        )}
                      </button>

                      <button
                        className="flex items-center gap-2 bg-red-600 px-2 py-1 text-xs text-white transition-colors hover:bg-red-700 disabled:bg-red-400"
                        onClick={handleDeleteSelectedOrAll}
                        disabled={isDeletingAllProfiles}
                        title="Delete selected profiles (or all if none selected)"
                      >
                        {isDeletingAllProfiles ? (
                          <>
                            <LoaderCircle className="size-4 animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <span>
                            {(selectedProfiles || []).length > 0
                              ? `Delete Selected (${(selectedProfiles || []).length})`
                              : `Delete All Profiles`}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-white/50">
                    Each profile maintains separate cookies and browsing state
                    {!settings.useSystemBrowser && " (Chromium browser)"}
                    {settings.useSystemBrowser && " (System browser)"}
                  </p>

                  {profileError &&
                  profileError.includes("deleted successfully") ? (
                    <p className="mt-1 text-xs text-green-400">
                      {profileError}
                    </p>
                  ) : profileError ? (
                    <p className="mt-1 text-xs text-red-400">{profileError}</p>
                  ) : null}
                  {profileRefreshError && (
                    <p className="mt-1 text-xs text-red-400">
                      {profileRefreshError}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 appearance-none rounded-none border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/50 ring-0 select-text focus:border-blue-500/50 focus:ring-0 focus:outline-none"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="New profile name"
                    disabled={
                      !settings.useSystemBrowser &&
                      chromiumStatus.lastChecked &&
                      !chromiumStatus.isInstalled
                    }
                  />
                  <button
                    className="bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600 disabled:bg-gray-600 disabled:opacity-50"
                    onClick={handleCreateProfile}
                    disabled={
                      isCreatingProfile ||
                      !newProfileName.trim() ||
                      (!settings.useSystemBrowser &&
                        chromiumStatus.lastChecked &&
                        !chromiumStatus.isInstalled)
                    }
                  >
                    {isCreatingProfile ? "Creating..." : "Create"}
                  </button>
                </div>

                {/* Browser status display for all profile operations */}
                {(browserStatus.status === "opening" ||
                  browserStatus.status === "open" ||
                  browserStatus.status === "error") && (
                  <div
                    className={`text-sm ${browserStatus.status === "error" ? "text-red-400" : browserStatus.status === "open" ? "text-green-400" : "text-blue-400"}`}
                  >
                    {browserStatus.status === "opening" && (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Opening Browser...
                      </span>
                    )}
                    {(browserStatus.status === "open" ||
                      browserStatus.status === "error") &&
                      browserStatus.message}
                  </div>
                )}

                {/* Chromium management section - only show when using chromium */}
                {!settings.useSystemBrowser && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <h4 className="mb-2 text-sm font-medium text-white/80">
                      Chromium Browser Management
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="border px-2 py-1 text-xs text-white transition-colors hover:bg-white/10"
                        onClick={handleCheckChromiumStatus}
                        disabled={chromiumOperation.status !== "idle"}
                      >
                        {chromiumOperation.status === "checking" ? (
                          <span className="flex items-center gap-1">
                            <LoaderCircle className="size-3 animate-spin" />
                            Checking...
                          </span>
                        ) : (
                          "Check Status"
                        )}
                      </button>

                      {/* Show status after check */}
                      {chromiumStatus.lastChecked && (
                        <>
                          <span
                            className={`text-xs font-medium ${chromiumStatus.isInstalled ? "text-green-400" : "text-red-400"}`}
                          >
                            {chromiumStatus.isInstalled
                              ? "✓ Installed"
                              : "✗ Not Installed"}
                          </span>

                          {/* Show version if installed */}
                          {chromiumStatus.isInstalled &&
                            chromiumStatus.version && (
                              <span className="text-xs text-white/60">
                                {chromiumStatus.version}
                              </span>
                            )}
                        </>
                      )}

                      {/* Install button - only show if not installed and status was checked */}
                      {chromiumStatus.lastChecked &&
                        chromiumStatus.isInstalled === false && (
                          <button
                            className="border bg-green-600 px-2 py-1 text-xs text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                            onClick={handleInstallChromium}
                            disabled={chromiumOperation.status !== "idle"}
                          >
                            {chromiumOperation.status === "installing" ? (
                              <span className="flex items-center gap-1">
                                <LoaderCircle className="size-3 animate-spin" />
                                Installing...
                              </span>
                            ) : (
                              <>
                                <Download
                                  size={12}
                                  className="mr-1 inline-block"
                                />
                                Install
                              </>
                            )}
                          </button>
                        )}

                      {/* Uninstall button - only show if installed and status was checked */}
                      {chromiumStatus.lastChecked &&
                        chromiumStatus.isInstalled === true && (
                          <button
                            className="border bg-red-600 px-2 py-1 text-xs text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            onClick={handleUninstallChromium}
                            disabled={chromiumOperation.status !== "idle"}
                          >
                            {chromiumOperation.status === "uninstalling" ? (
                              <span className="flex items-center gap-1">
                                <LoaderCircle className="size-3 animate-spin" />
                                Uninstalling...
                              </span>
                            ) : (
                              <>
                                <Trash2
                                  size={12}
                                  className="mr-1 inline-block"
                                />
                                Uninstall
                              </>
                            )}
                          </button>
                        )}

                      {/* Operation status message */}
                      {chromiumOperation.status === "success" && (
                        <span className="text-xs text-green-400">
                          {chromiumOperation.message}
                        </span>
                      )}
                      {chromiumOperation.status === "error" && (
                        <span className="text-xs text-red-400">
                          {chromiumOperation.message}
                        </span>
                      )}
                    </div>

                    {/* Warning when status not checked */}
                    {chromiumStatus.lastChecked === undefined && (
                      <div className="mt-2 border-l-2 border-yellow-500 bg-yellow-900/20 py-2 pl-3">
                        <p className="text-xs text-yellow-400">
                          ⚠️ Chromium browser status not checked. Please check
                          status to ensure automation will work.
                        </p>
                      </div>
                    )}

                    {/* Warning when not installed */}
                    {chromiumStatus.lastChecked &&
                      !chromiumStatus.isInstalled && (
                        <div className="mt-2 border-l-2 border-red-500 bg-red-900/20 py-2 pl-3">
                          <p className="text-xs text-red-400">
                            ⚠️ Chromium browser is not installed. Automation
                            tasks will fail. Please install Chromium or switch
                            to System Browser in Browser Settings.
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Placeholder for future content */}
          <div className="w-full">
            <div className="p-4">
              <h3 className="mb-3 text-sm font-medium text-white">
                Additional Settings
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-white/50">
                  Additional profile configuration options will be added here.
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

export default ProfileManagement;
