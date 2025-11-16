import { aiSettingsHandler } from "./ai/aiSettingsHandler.js";
import { registerAutomationHandlers } from "./automation/index.js";
import { registerBrowserHandlers } from "./browser/index.js";
import { registerWalletHandlers } from "./wallet/index.js";
import { registerWindowHandlers } from "./window/index.js";

export interface IpcHandlerRegistration {
  (): void;
}

export default function registerIpcHandlers() {
  const handlers: IpcHandlerRegistration[] = [
    registerAutomationHandlers,
    registerWindowHandlers,
    registerBrowserHandlers,
    registerWalletHandlers,
    aiSettingsHandler,
  ];

  handlers.forEach((register) => {
    try {
      register();
    } catch (error) {
      console.error(`Error registering IPC handlers: ${error}`);
    }
  });

  console.log("All IPC handlers registered successfully");
}
