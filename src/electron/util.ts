import { ipcMain, WebContents, WebFrameMain } from "electron";
import { pathToFileURL } from "url";

import { IpcChannelMap } from "../../types/global-types.js";
import { getUIPath } from "./pathResolver.js";

export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export function ipcMainHandle<K extends keyof IpcChannelMap>(
  key: K,
  handler: (
    ...args: IpcChannelMap[K]["args"]
  ) => IpcChannelMap[K]["return"] | Promise<IpcChannelMap[K]["return"]>,
) {
  ipcMain.handle(key, (event, ...args: IpcChannelMap[K]["args"]) => {
    validateEventFrame(event.senderFrame);
    return handler(...args);
  });
}

export function ipcWebContentsSend<K extends keyof IpcChannelMap>(
  key: K,
  webContents: WebContents,
  payload: IpcChannelMap[K]["return"],
) {
  webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain | null) {
  console.log("frame url is", frame?.url);
  if (!frame) return;
  if (isDev() && new URL(frame.url).host === "localhost:5123") {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error("Malicious event");
  }
}
