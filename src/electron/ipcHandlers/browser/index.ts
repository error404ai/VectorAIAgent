// src/electron/ipcHandlers/browser/index.ts
import registerBrowserSettingsHandlers from "./browserSettingsHandler.js";
import { registerChromiumHandlers } from "./chromiumHandler.js";

export function registerBrowserHandlers() {
  registerBrowserSettingsHandlers();
  registerChromiumHandlers();
}
