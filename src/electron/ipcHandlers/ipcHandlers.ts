import type { BrowserWindow } from "electron";
import { aiSettingsHandler } from "./ai/aiSettingsHandler.js";
import { registerAutomationHandlers } from "./automation/index.js";
import { registerBrowserHandlers } from "./browser/index.js";
import { registerWalletHandlers } from "./wallet/index.js";
import { registerWindowHandlers } from "./window/index.js";

export interface IpcHandlerRegistration {
  (mainWindow?: BrowserWindow | null): void;
}

export default function registerIpcHandlers(mainWindow?: BrowserWindow | null) {
  const handlers: IpcHandlerRegistration[] = [
    (mw) => registerAutomationHandlers(mw),
    registerWindowHandlers,
    registerBrowserHandlers,
    registerWalletHandlers,
    aiSettingsHandler,
  ];

  handlers.forEach((register) => {
    try {
      register(mainWindow);
    } catch (error) {
      console.error(`Error registering IPC handlers: ${error}`);
    }
  });

  console.log("All IPC handlers registered successfully");
}
