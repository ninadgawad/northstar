import { contextBridge } from "electron";

const api = {
  appVersion: process.env["npm_package_version"] ?? "0.0.0",
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("api", api);
} else {
  // @ts-expect-error contextIsolation disabled fallback
  window.api = api;
}
