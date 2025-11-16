import { registerBrowserAutomationHandlers } from "./browserAutomationHandler.js";
import { registerBrowserOpenerHandlers } from "./browserOpenerHandler.js";

export function registerAutomationHandlers() {
  registerBrowserAutomationHandlers();
  registerBrowserOpenerHandlers();
}
