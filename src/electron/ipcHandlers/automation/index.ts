import type { BrowserWindow } from "electron";
import { registerBrowserAutomationHandlers } from "./browserAutomationHandler.js";
import { registerBrowserOpenerHandlers } from "./browserOpenerHandler.js";
import { registerEkoAutomationHandlers } from "./ekoAutomationHandler.js";

export function registerAutomationHandlers(mainWindow?: BrowserWindow | null) {
  registerBrowserAutomationHandlers();
  registerBrowserOpenerHandlers();
  registerEkoAutomationHandlers(mainWindow || null);
}
