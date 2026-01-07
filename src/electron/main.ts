import { app, BrowserWindow } from "electron";

import registerIpcHandlers from "./ipcHandlers/ipcHandlers.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { isDev } from "./util.js";

function createWindow() {
  const preloadPath = getPreloadPath();
  const mainWindow = new BrowserWindow({
    height: 670,
    width: 1010,
    show: false,
    resizable: false,
    titleBarStyle: "hidden",
    // backgroundColor: "#E84033",
    frame: false,
    transparent: true,
    title: "Whiskey Automation",
    maximizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      webviewTag: true,
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(getUIPath());
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev()) {
      console.log("Development mode: opening dev tools");
      mainWindow.webContents.openDevTools();
    }
  });

  return mainWindow;
}

app.on("ready", async () => {
  const mainWindow = createWindow();

  registerIpcHandlers(mainWindow);
});
