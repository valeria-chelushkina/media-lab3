/**
 * Keep the largest coefficients by magnitude. A global quantile
 * threshold is used instead of a per-block rule so both transforms can be
 * compared on the same "share of coefficients kept" scale.
 */

export type CompressionResult = {
  coeffs: Float64Array
  kept: number
  total: number
  threshold: number
}

function countNonZero(values: Float64Array): number {
  let count = 0
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] !== 0) count += 1
  }
  return count
}

/**
 * Keeps the largest `keepFraction` of the coefficients (by absolute value)
 * and zeroes the rest. `keepFraction` is clamped to [0, 1].
 */
export function keepLargest(coeffs: Float64Array, keepFraction: number): CompressionResult {
  const total = coeffs.length
  const fraction = Number.isFinite(keepFraction)
    ? Math.min(1, Math.max(0, keepFraction))
    : 1
  const target = Math.round(fraction * total)
  const out = new Float64Array(coeffs)

  if (target >= total) {
    return { coeffs: out, kept: countNonZero(out), total, threshold: 0 }
  }

  if (target <= 0) {
    out.fill(0)
    return { coeffs: out, kept: 0, total, threshold: Number.POSITIVE_INFINITY }
  }

  const magnitudes = Float64Array.from(coeffs, Math.abs).sort()
  const threshold = magnitudes[total - target]

  if (threshold <= 0) {
    return { coeffs: out, kept: countNonZero(out), total, threshold: 0 }
  }

  let kept = 0
  for (let i = 0; i < total; i += 1) {
    if (Math.abs(coeffs[i]) >= threshold) {
      kept += 1
    } else {
      out[i] = 0
    }
  }

  return { coeffs: out, kept, total, threshold }
}
