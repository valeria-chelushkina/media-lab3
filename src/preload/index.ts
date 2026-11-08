import { contextBridge } from 'electron'

/**
 * The only bridge between Electron and the UI.
 * Keep it small: dialogs and fs belong in the main process, math stays in the renderer.
 */
const api = {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    v8: process.versions.v8,
  },
  platform: process.platform,
}

contextBridge.exposeInMainWorld('api', api)

export type PreloadApi = typeof api
