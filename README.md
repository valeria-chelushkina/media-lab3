# Lab work #3 for Multimedia

Lossy image compression with DCT and Haar DWT. See `task.md` for the assignment.

## Stack

Electron + Vite + React + TypeScript, built with [electron-vite](https://electron-vite.org).

```
src/
├─ main/       Electron main process (window, later: dialogs / fs)
├─ preload/    contextBridge API exposed to the UI as window.api
└─ renderer/   React UI (src/ = app code, lib/ = pure math, no DOM)
```

## Scripts

| Command            | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Vite dev server + Electron window, hot reload         |
| `npm run build`    | Bundles main, preload and renderer into `out/`        |
| `npm run start`    | Runs the built app (`build` first)                    |
| `npm run typecheck`| `tsc --noEmit` over the whole project                 |

## Notes

- Renderer talks to Electron only through `window.api` (`src/preload/index.ts`). Keep
  `contextIsolation: true` and `nodeIntegration: false`.
- Put transforms, thresholding and PSNR in `src/renderer/src/lib/` as pure functions
  (no DOM, no electron imports) so they can be unit-tested in plain Node later.
