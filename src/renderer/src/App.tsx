import { useState } from 'react'
import GrayCanvas from '@renderer/components/GrayCanvas'
import { forwardDct2D, toLogMagnitude } from '@core/dct'
import { IMAGE_SIZE } from '@core/image'
import { loadImageToGray } from '@renderer/services/imageFiles'

type Loaded = {
  name: string
  gray: Float32Array
  spectrum: Float32Array
  ms: number
  maxAbs: number
  meanAbs: number
  nonzero: number
}

export default function App(): React.JSX.Element {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File): Promise<void> {
    setBusy(true)
    setError(null)

    try {
      // 1. decode + normalize to 512x512 grayscale
      const gray = await loadImageToGray(file, IMAGE_SIZE)

      // 2. forward DCT per 8x8 block
      const started = performance.now()
      const coeffs = forwardDct2D(gray, IMAGE_SIZE, IMAGE_SIZE)
      const ms = performance.now() - started

      // 3. simple coefficient statistics for the panel footer
      let maxAbs = 0
      let sumAbs = 0
      let nonzero = 0
      for (let i = 0; i < coeffs.length; i += 1) {
        const magnitude = Math.abs(coeffs[i])
        if (magnitude > maxAbs) maxAbs = magnitude
        sumAbs += magnitude
        if (magnitude > 1e-9) nonzero += 1
      }

      setLoaded({
        name: file.name,
        gray,
        spectrum: toLogMagnitude(coeffs),
        ms,
        maxAbs,
        meanAbs: sumAbs / coeffs.length,
        nonzero,
      })
    } catch (cause) {
      setLoaded(null)
      setError(cause instanceof Error ? cause.message : 'Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Multimedia · Lab 3</p>
          <h1>DCT — forward transform</h1>
          <p className="subtitle">
            Photo → 512×512 grayscale → 8×8 block DCT. Coefficients are shown as log magnitude.
          </p>
        </div>

        <label className={`file-button${busy ? ' is-busy' : ''}`}>
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
              event.target.value = ''
            }}
          />
          {busy ? 'Working…' : loaded ? 'Load another photo' : 'Load photo'}
        </label>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {loaded ? (
        <>
          <div className="stats">
            <div className="stat">
              <span>File</span>
              <strong title={loaded.name}>{loaded.name}</strong>
            </div>
            <div className="stat">
              <span>Input</span>
              <strong>
                {IMAGE_SIZE} × {IMAGE_SIZE}
              </strong>
            </div>
            <div className="stat">
              <span>Blocks</span>
              <strong>64 × 64 of 8×8</strong>
            </div>
            <div className="stat">
              <span>Forward DCT</span>
              <strong>{loaded.ms.toFixed(1)} ms</strong>
            </div>
            <div className="stat">
              <span>max |F|</span>
              <strong>{loaded.maxAbs.toFixed(0)}</strong>
            </div>
            <div className="stat">
              <span>mean |F|</span>
              <strong>{loaded.meanAbs.toFixed(2)}</strong>
            </div>
          </div>

          <div className="panels">
            <GrayCanvas
              gray={loaded.gray}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              title="Original"
              note="grayscale, normalized"
            />
            <GrayCanvas
              gray={loaded.spectrum}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              title="DCT coefficients"
              note="log(1 + |F|), scaled to 0–255"
            />
          </div>
        </>
      ) : (
        <div className="empty">
          <p>Load a photo to see the original and its DCT coefficients side by side.</p>
          <p className="empty-hint">The image is resized to {IMAGE_SIZE}×{IMAGE_SIZE} and converted to grayscale first.</p>
        </div>
      )}

      <footer className="footnote">
        Forward DCT only for now · inverse DCT, coefficient dropping and DWT come next.
      </footer>
    </div>
  )
}
