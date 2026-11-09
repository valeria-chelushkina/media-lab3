import { useEffect, useMemo, useState } from 'react'
import GrayCanvas from '@renderer/components/GrayCanvas'
import ResultsTable, {
  downloadResultsCsv,
  type SweepRow,
} from '@renderer/components/ResultsTable'
import { IMAGE_SIZE } from '@core/image'
import { runDct, runDwt, type MethodResult } from '@core/pipeline'
import { toLogMagnitude } from '@core/visualize'
import { loadImageToGray } from '@renderer/services/imageFiles'

const SWEEP_LEVELS = [1, 0.5, 0.25, 0.1, 0.05]
const DWT_LEVELS = [1, 2, 3, 4]

type LoadedImage = {
  name: string
  gray: Float32Array
}

type View = {
  dct: MethodResult
  dwt: MethodResult
  dctSpectrum: Float32Array
  dwtSpectrum: Float32Array
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

function sharePercent(result: MethodResult): number {
  return result.total > 0 ? (result.kept / result.total) * 100 : 0
}

function toSweepRow(
  method: SweepRow['method'],
  fraction: number,
  result: MethodResult,
): SweepRow {
  return {
    method,
    keepPercent: Math.round(fraction * 100),
    kept: result.kept,
    total: result.total,
    psnr: result.psnr,
  }
}

export default function App(): React.JSX.Element {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [keepPercent, setKeepPercent] = useState(25)
  const [dwtLevels, setDwtLevels] = useState(3)
  const [sweep, setSweep] = useState<SweepRow[] | null>(null)
  const [sweeping, setSweeping] = useState(false)

  const appliedPercent = useDebounced(keepPercent, 90)

  const view = useMemo<View | null>(() => {
    if (!image) return null

    const started = performance.now()
    const fraction = appliedPercent / 100
    const dct = runDct(image.gray, IMAGE_SIZE, IMAGE_SIZE, fraction)
    const dwt = runDwt(image.gray, IMAGE_SIZE, IMAGE_SIZE, fraction, dwtLevels)
    const ms = performance.now() - started

    return {
      dct,
      dwt,
      dctSpectrum: toLogMagnitude(dct.coeffs),
      dwtSpectrum: toLogMagnitude(dwt.coeffs),
      ms,
    }
  }, [image, appliedPercent, dwtLevels])

  useEffect(() => {
    setSweep(null)
  }, [image, dwtLevels])

  async function handleFile(file: File): Promise<void> {
    setBusy(true)
    setError(null)

    try {
      const gray = await loadImageToGray(file, IMAGE_SIZE)
      setImage({ name: file.name, gray })
    } catch (cause) {
      setImage(null)
      setError(cause instanceof Error ? cause.message : 'Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  function handleSweep(): void {
    if (!image) return

    setSweeping(true)
    window.setTimeout(() => {
      const rows: SweepRow[] = []

      for (const fraction of SWEEP_LEVELS) {
        rows.push(
          toSweepRow('DCT', fraction, runDct(image.gray, IMAGE_SIZE, IMAGE_SIZE, fraction)),
        )
        rows.push(
          toSweepRow(
            'DWT',
            fraction,
            runDwt(image.gray, IMAGE_SIZE, IMAGE_SIZE, fraction, dwtLevels),
          ),
        )
      }

      setSweep(rows)
      setSweeping(false)
    }, 0)
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Multimedia · Lab 3</p>
          <h1>DCT vs DWT — lossy compression</h1>
          <p className="subtitle">
            Photo → 512×512 grayscale → 8×8 block DCT or Haar DWT → keep the largest
            coefficients → inverse transform. PSNR shows what the dropped coefficients cost.
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

            <div className="option-row">
              <label htmlFor="levels">Haar decomposition levels</label>
              <select
                id="levels"
                value={dwtLevels}
                onChange={(event) => setDwtLevels(Number(event.target.value))}
              >
                {DWT_LEVELS.map((levels) => (
                  <option key={levels} value={levels}>
                    {levels}
                  </option>
                ))}
              </select>
            </div>

            <p className="controls-hint">
              {keepPercent !== appliedPercent
                ? 'Recomputing…'
                : `Threshold — DCT ${view.dct.threshold.toFixed(1)} · DWT ${view.dwt.threshold.toFixed(1)}`}
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
              <span>Both methods</span>
              <strong>{view.ms.toFixed(0)} ms</strong>
            </div>
            <div className="stat">
              <span>DCT PSNR</span>
              <strong>{formatPsnr(view.dct.psnr)}</strong>
            </div>
            <div className="stat">
              <span>DWT PSNR</span>
              <strong>{formatPsnr(view.dwt.psnr)}</strong>
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
              gray={view.dct.reconstructed}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              title="DCT reconstruction"
              note={`PSNR ${formatPsnr(view.dct.psnr)} · ${sharePercent(view.dct).toFixed(1)}% kept`}
            />
            <GrayCanvas
              gray={view.dwt.reconstructed}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              title="DWT reconstruction"
              note={`PSNR ${formatPsnr(view.dwt.psnr)} · ${sharePercent(view.dwt).toFixed(1)}% kept`}
            />
          </div>

          <div className="panels secondary">
            <GrayCanvas
              gray={view.dctSpectrum}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              title="DCT coefficients"
              note="log(1 + |F|), dropped ones are black"
            />
            <GrayCanvas
              gray={view.dwtSpectrum}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              title="DWT coefficients"
              note={`Haar, ${dwtLevels} level${dwtLevels === 1 ? '' : 's'} · log magnitude`}
            />
          </div>

          <section className="sweep">
            <div className="sweep-head">
              <div>
                <h2>Experiments</h2>
                <p className="sweep-hint">
                  100 / 50 / 25 / 10 / 5% for both methods · {dwtLevels} Haar level
                  {dwtLevels === 1 ? '' : 's'}
                </p>
              </div>
              <div className="sweep-actions">
                <button type="button" onClick={handleSweep} disabled={sweeping}>
                  {sweeping ? 'Running…' : 'Run sweep'}
                </button>
                {sweep ? (
                  <button type="button" className="ghost" onClick={() => downloadResultsCsv(sweep)}>
                    Export CSV
                  </button>
                ) : null}
              </div>
            </div>

            {sweep ? (
              <ResultsTable rows={sweep} />
            ) : (
              <p className="sweep-empty">
                Runs the five keep levels for DCT and DWT and records kept coefficients,
                PSNR and the estimated ratio.
              </p>
            )}
          </section>
        </>
      ) : (
        <div className="empty">
          <p>Load a photo to compare DCT and DWT compression at the same keep share.</p>
          <p className="empty-hint">
            The image is resized to {IMAGE_SIZE}×{IMAGE_SIZE} and converted to grayscale first.
          </p>
        </div>
      )}

      <footer className="footnote">
        Own DCT (matrix form) and Haar DWT · adjustable coefficient dropping · PSNR + experiments
      </footer>
    </div>
  )
}
