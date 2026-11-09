import { useEffect, useMemo, useState } from 'react'
import GrayCanvas from '@renderer/components/GrayCanvas'
import { toLogMagnitude } from '@core/dct'
import { IMAGE_SIZE } from '@core/image'
import { runDct, type MethodResult } from '@core/pipeline'
import { loadImageToGray } from '@renderer/services/imageFiles'

type LoadedImage = {
  name: string
  gray: Float32Array
}

type DctView = MethodResult & {
  spectrum: Float32Array
  ms: number
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

function formatPsnr(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)} dB` : '∞ dB'
}

export default function App(): React.JSX.Element {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [keepPercent, setKeepPercent] = useState(25)
  const appliedPercent = useDebounced(keepPercent, 90)

  const view = useMemo<DctView | null>(() => {
    if (!image) return null

    const started = performance.now()
    const result = runDct(image.gray, IMAGE_SIZE, IMAGE_SIZE, appliedPercent / 100)
    const ms = performance.now() - started

    return { ...result, spectrum: toLogMagnitude(result.coeffs), ms }
  }, [image, appliedPercent])

  async function handleFile(file: File): Promise<void> {
    setBusy(true)
    setError(null)

    try {
      // decode + normalize to 512x512 grayscale
      const gray = await loadImageToGray(file, IMAGE_SIZE)
      setImage({ name: file.name, gray })
    } catch (cause) {
      setImage(null)
      setError(cause instanceof Error ? cause.message : 'Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  const share = view && view.total > 0 ? view.kept / view.total : 0

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Multimedia · Lab 3</p>
          <h1>DCT — compression and PSNR</h1>
          <p className="subtitle">
            Photo → 512×512 grayscale → 8×8 block DCT → keep the largest coefficients →
            inverse DCT. PSNR shows what the dropped coefficients cost.
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
          {busy ? 'Working…' : image ? 'Load another photo' : 'Load photo'}
        </label>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {image && view ? (
        <>
          <div className="controls">
            <div className="slider-row">
              <label htmlFor="keep">Keep largest coefficients</label>
              <input
                id="keep"
                type="range"
                min={1}
                max={100}
                step={1}
                value={keepPercent}
                onChange={(event) => setKeepPercent(Number(event.target.value))}
              />
              <output htmlFor="keep">{keepPercent}%</output>
            </div>
            <p className="controls-hint">
              {keepPercent !== appliedPercent
                ? 'Recomputing…'
                : `Threshold ${view.threshold.toFixed(1)} · ${view.kept.toLocaleString()} of ${view.total.toLocaleString()} coefficients kept`}
            </p>
          </div>

          <div className="stats">
            <div className="stat">
              <span>File</span>
              <strong title={image.name}>{image.name}</strong>
            </div>
            <div className="stat">
              <span>Input</span>
              <strong>
                {IMAGE_SIZE} × {IMAGE_SIZE}
              </strong>
            </div>
            <div className="stat">
              <span>Total time</span>
              <strong>{view.ms.toFixed(1)} ms</strong>
            </div>
            <div className="stat">
              <span>PSNR</span>
              <strong>{formatPsnr(view.psnr)}</strong>
            </div>
            <div className="stat">
              <span>Kept</span>
              <strong>
                {view.kept.toLocaleString()} ({(share * 100).toFixed(1)}%)
              </strong>
            </div>
            <div className="stat">
              <span>Est. ratio</span>
              <strong>{view.kept === 0 ? '∞' : `${(view.total / view.kept).toFixed(1)}×`}</strong>
            </div>
          </div>

          <div className="panels">
            <GrayCanvas
              gray={image.gray}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              title="Original"
              note="grayscale, normalized"
            />
            <GrayCanvas
              gray={view.spectrum}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              title="DCT coefficients"
              note="log(1 + |F|), dropped ones are black"
            />
            <GrayCanvas
              gray={view.reconstructed}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              title="DCT reconstruction"
              note={`inverse DCT · ${(share * 100).toFixed(1)}% kept`}
            />
          </div>
        </>
      ) : (
        <div className="empty">
          <p>Load a photo to compress it with the DCT and see the PSNR.</p>
          <p className="empty-hint">
            The image is resized to {IMAGE_SIZE}×{IMAGE_SIZE} and converted to grayscale first.
          </p>
        </div>
      )}

      <footer className="footnote">
        DCT · adjustable coefficient dropping + PSNR · Haar DWT comes next.
      </footer>
    </div>
  )
}
