import { BrowserWindow } from "electron";
import { ipcMainHandle } from "../../util.js";

export function registerWindowControlHandlers() {
  // Handler for minimizing the window
  ipcMainHandle("minimizeWindow", async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.minimize();
    }
  });

  // Handler for closing the window
  ipcMainHandle("closeWindow", async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.close();
    }
  });

  console.log("Window control IPC handlers registered");
}
