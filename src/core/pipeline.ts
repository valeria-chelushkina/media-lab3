/**
 * One DCT experiment: forward transform, coefficient reduction, inverse
 * transform and quality measurement. The same shape will be returned by the
 * DWT pipeline so the two methods can be compared side by side.
 */
import { forwardDct2D, inverseDct2D } from '@core/dct'
import { forwardHaar2D, inverseHaar2D, HAAR_LEVELS } from '@core/dwt'
import { keepLargest } from '@core/compress'
import { mse, psnrFromMse } from '@core/metrics'

export type MethodResult = {
  reconstructed: Float32Array
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

export function runDwt(
  gray: Float32Array,
  width: number,
  height: number,
  keepFraction: number,
  levels: number = HAAR_LEVELS,
): MethodResult {
  const forward = forwardHaar2D(gray, width, height, levels)
  const compressed = keepLargest(forward, keepFraction)
  const reconstructed = inverseHaar2D(compressed.coeffs, width, height, levels)
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
