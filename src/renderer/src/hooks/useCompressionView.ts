import { useMemo } from 'react'
import { IMAGE_SIZE } from '@core/image'
import { runDct, runDwt } from '@core/pipeline'
import { toLogMagnitude } from '@core/visualize'
import { useDebounced } from '@renderer/hooks/useDebounced'
import type { CompressionView, LoadedImage } from '@renderer/types'

export function useCompressionView(
  image: LoadedImage | null,
  keepPercent: number,
  dwtLevels: number,
): { view: CompressionView | null; pending: boolean } {
  const appliedPercent = useDebounced(keepPercent, 90)

  const view = useMemo<CompressionView | null>(() => {
    if (!image) return null

    const fraction = appliedPercent / 100

    const dctStart = performance.now()
    const dct = runDct(image.gray, IMAGE_SIZE, IMAGE_SIZE, fraction)
    const dctMs = performance.now() - dctStart

    const dwtStart = performance.now()
    const dwt = runDwt(image.gray, IMAGE_SIZE, IMAGE_SIZE, fraction, dwtLevels)
    const dwtMs = performance.now() - dwtStart

    return {
      dct,
      dwt,
      dctSpectrum: toLogMagnitude(dct.coeffs),
      dwtSpectrum: toLogMagnitude(dwt.coeffs),
      dctMs,
      dwtMs,
    }
  }, [image, appliedPercent, dwtLevels])

  return { view, pending: keepPercent !== appliedPercent }
}
