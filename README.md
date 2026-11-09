# Lab work #3 for Multimedia

Lossy image compression with DCT and Haar DWT. See `task.md` for the assignment.

## Stack

Electron + Vite + React + TypeScript, built with [electron-vite](https://electron-vite.org).

```
src/
├─ core/       Algorithms: DCT, DWT, compression, metrics (no DOM, no Electron)
├─ main/       Electron main process (window, later: dialogs / fs)
├─ preload/    contextBridge API exposed to the UI as window.api
└─ renderer/   React UI (components, services, styles)
```

Imports use path aliases: `@core/...` for algorithms, `@renderer/...` for UI code.

The forward DCT follows the lecture slides `learn/Multi_10.pdf` (slides 16–18): the
2D transform is `F = M·B·Mᵀ` with `M[u][i] = C(u)/2 · cos((2i+1)uπ/16)` and
`C(0) = √2/2`, `C(ξ>0) = 1`, applied to raw pixel values (no level shift). The inverse
is `B = Mᵀ·F·M`, exactly slide 17's IDCT (no extra scaling, because the basis is
orthonormal — see slide 30).

## Scripts

| Command            | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Vite dev server + Electron window, hot reload         |
| `npm run build`    | Bundles main, preload and renderer into `out/`        |
| `npm run start`    | Runs the built app (`build` first)                    |
| `npm run typecheck`| `tsc --noEmit` over the whole project                 |
| `npm test`         | Vitest unit tests for the algorithms in `src/core`    |

## Notes

- Renderer talks to Electron only through `window.api` (`src/preload/index.ts`). Keep
  `contextIsolation: true` and `nodeIntegration: false`.
- Put transforms, thresholding and PSNR in `src/core/` as pure functions
  (no DOM, no Electron imports) so they can be unit-tested in plain Node.
