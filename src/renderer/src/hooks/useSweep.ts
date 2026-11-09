import { useEffect, useState } from 'react'
import { IMAGE_SIZE } from '@core/image'
import { runDct, runDwt } from '@core/pipeline'
import type { MethodResult } from '@core/pipeline'
import type { LoadedImage, SweepRow } from '@renderer/types'

const SWEEP_LEVELS = [1, 0.5, 0.25, 0.1, 0.05]

function toRow(
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

export function useSweep(
  image: LoadedImage | null,
  dwtLevels: number,
): { rows: SweepRow[] | null; running: boolean; run: () => void } {
  const [rows, setRows] = useState<SweepRow[] | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    setRows(null)
  }, [image, dwtLevels])

  function run(): void {
    if (!image || running) return

    setRunning(true)
    window.setTimeout(() => {
      const next: SweepRow[] = []

      for (const fraction of SWEEP_LEVELS) {
        next.push(
          toRow('DCT', fraction, runDct(image.gray, IMAGE_SIZE, IMAGE_SIZE, fraction)),
        )
        next.push(
          toRow('DWT', fraction, runDwt(image.gray, IMAGE_SIZE, IMAGE_SIZE, fraction, dwtLevels)),
        )
      }

      setRows(next)
      setRunning(false)
    }, 0)
  }

  return { rows, running, run }
}
