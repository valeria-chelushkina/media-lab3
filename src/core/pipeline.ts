/**
 * One DCT experiment: forward transform, coefficient reduction, inverse
 * transform and quality measurement. The same shape will be returned by the
 * DWT pipeline so the two methods can be compared side by side.
 */
import { forwardDct2D, inverseDct2D } from '@core/dct'
import { keepLargest } from '@core/compress'
import { mse, psnrFromMse } from '@core/metrics'

export type MethodResult = {
  reconstructed: Float32Array
  /** Coefficients after reduction, ready for display. */
  coeffs: Float64Array
  kept: number
  total: number
  threshold: number
  mse: number
  psnr: number
}

export function runDct(
  gray: Float32Array,
  width: number,
  height: number,
  keepFraction: number,
): MethodResult {
  const forward = forwardDct2D(gray, width, height)
  const compressed = keepLargest(forward, keepFraction)
  const reconstructed = inverseDct2D(compressed.coeffs, width, height)
  const error = mse(gray, reconstructed)

  return {
    reconstructed,
    coeffs: compressed.coeffs,
    kept: compressed.kept,
    total: compressed.total,
    threshold: compressed.threshold,
    mse: error,
    psnr: psnrFromMse(error),
  }
}
