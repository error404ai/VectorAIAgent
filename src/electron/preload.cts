import type { AutomationRuntimeOptions } from "../../types/global-types";
import {
  ExtendedIpcRendererAPI,
  IpcChannelMap,
  IpcRendererAPI,
  IpcUnsubscribe,
} from "../../types/global-types";
import { ModelConfig } from "../../types/model";

const { contextBridge, ipcRenderer } = require("electron");

const api = {
  selectUploadDirectory: () => ipcInvoke("selectUploadDirectory"),
  console: (text: string) => ipcInvoke("console", text),
  runBrowserAutomation: (
    prompt: string,
    modelConfig?: ModelConfig,
    options?: AutomationRuntimeOptions,
  ) => ipcInvoke("runBrowserAutomation", prompt, modelConfig, options),
  runBrowserAutomationTask: (
    taskId: string,
    profile: string,
    prompt: string,
    modelConfig?: ModelConfig,
    options?: AutomationRuntimeOptions,
  ) =>
    ipcInvoke(
      "runBrowserAutomationTask",
      taskId,
      profile,
      prompt,
      modelConfig,
      options,
    ),
  stopBrowserAutomation: () => ipcInvoke("stopBrowserAutomation"),
  stopBrowserAutomationTask: (taskId: string) =>
    ipcInvoke("stopBrowserAutomationTask", taskId),
  openBrowser: (
    url?: string,
    useSystemBrowser?: boolean,
    systemBrowserPath?: string,
  ) => ipcInvoke("openBrowser", url, useSystemBrowser, systemBrowserPath),
  openBrowserWithProfile: (
    url?: string,
    profileName?: string,
    useSystemBrowser?: boolean,
    browserPath?: string,
  ) =>
    ipcInvoke(
      "openBrowserWithProfile",
      url,
      profileName,
      useSystemBrowser,
      browserPath,
    ),
  browserAutomationLog: (log: string | { taskId?: string; log: string }) =>
    ipcInvoke("browserAutomationLog", log),
  browserAutomationError: (
    error: string | { taskId?: string; error: string },
  ) => ipcInvoke("browserAutomationError", error),
  minimizeWindow: () => ipcInvoke("minimizeWindow"),
  closeWindow: () => ipcInvoke("closeWindow"),
  // AI Settings - get from backend for initial sync
  getAISettings: () => ipcInvoke("getAISettings"),
  saveAISettings: (settings) => ipcInvoke("saveAISettings", settings),
  // Agent settings - persisted in main settings.json
  getAgentSettings: () => ipcInvoke("getAgentSettings"),
  saveAgentSettings: (settings) => ipcInvoke("saveAgentSettings", settings),
  // Browser Settings - minimal backend sync
  getBrowserSettings: () => ipcInvoke("getBrowserSettings"),
  saveBrowserSettings: (settings) => ipcInvoke("saveBrowserSettings", settings),
  // Browser Profile Operations - these come from Python exe and update state
  getBrowserProfiles: () => ipcInvoke("getBrowserProfiles"),
  createBrowserProfile: (profileName: string, browserPath: string) =>
    ipcInvoke("createBrowserProfile", profileName, browserPath),
  updateAvailableProfiles: (profiles: string[]) =>
    ipcInvoke("updateAvailableProfiles", profiles),
  deleteBrowserProfile: (profileName: string, browserPath?: string) =>
    ipcInvoke("deleteBrowserProfile", profileName, browserPath),
  deleteAllBrowserProfiles: () => ipcInvoke("deleteAllBrowserProfiles"),
  // Chromium management IPC handlers
  checkChromiumStatus: () => ipcInvoke("checkChromiumStatus"),
  installChromium: () => ipcInvoke("installChromium"),
  uninstallChromium: () => ipcInvoke("uninstallChromium"),
  // Wallet management IPC handlers
  getWallets: () => ipcInvoke("getWallets"),
  generateWallet: (name: string) => ipcInvoke("generateWallet", name),
  updateWalletBalance: (walletId: string, rpcUrl?: string) =>
    ipcInvoke("updateWalletBalance", walletId, rpcUrl),
  deleteWallet: (walletId: string) => ipcInvoke("deleteWallet", walletId),
  setWalletProfile: (walletId: string, profileId: string | null) =>
    ipcInvoke("setWalletProfile", walletId, profileId),
  updateWalletName: (walletId: string, name: string) =>
    ipcInvoke("updateWalletName", walletId, name),
  // Eko automation IPC handlers
  runEkoAutomation: (options: {
    taskId: string;
    prompt: string;
    modelConfig?: ModelConfig;
  }) => ipcInvoke("runEkoAutomation", options),
  stopEkoAutomation: (taskId: string) => ipcInvoke("stopEkoAutomation", taskId),
} satisfies IpcRendererAPI;

contextBridge.exposeInMainWorld("electronAPI", {
  ...api,
  onTabsUpdated: (
    callback: (tabsData: { tabs: any[]; activeTabId: string | null }) => void,
  ) => {
    // Placeholder - not implemented yet
    return () => {};
  },
  onBrowserAutomationLog: (
    callback: (log: string | { taskId?: string; log: string }) => void,
  ) => ipcOn("browserAutomationLog", callback),
  onBrowserAutomationError: (
    callback: (error: string | { taskId?: string; error: string }) => void,
  ) => ipcOn("browserAutomationError", callback),
} satisfies ExtendedIpcRendererAPI);

function ipcInvoke<K extends keyof IpcChannelMap>(
  key: K,
  ...args: IpcChannelMap[K]["args"]
): Promise<IpcChannelMap[K]["return"]> {
  return ipcRenderer.invoke(key, ...args);
}

function ipcOn<K extends keyof IpcChannelMap>(
  key: K,
  callback: (...args: IpcChannelMap[K]["args"]) => void,
): IpcUnsubscribe {
  const listener = (
    _: Electron.IpcRendererEvent,
    ...args: IpcChannelMap[K]["args"]
  ) => callback(...args);
  ipcRenderer.on(key, listener);
  return () => ipcRenderer.off(key, listener);
}
