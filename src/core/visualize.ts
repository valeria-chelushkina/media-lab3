/**
 * log(1 + |F|) normalized to 0..255, then gamma-lifted. DC/low-frequency terms
 * are orders of magnitude above the details, so a plain log scale leaves the
 * high frequencies almost black; the gamma restores contrast.
 */
export function toLogMagnitude(
  coeffs: Float64Array | Float32Array,
  gamma = 0.45,
): Float32Array {
  let peak = 0

  for (let i = 0; i < coeffs.length; i += 1) {
    const magnitude = Math.abs(coeffs[i])
    if (magnitude > peak) peak = magnitude
  }

  const denominator = Math.log1p(peak) || 1
  const image = new Float32Array(coeffs.length)

  for (let i = 0; i < coeffs.length; i += 1) {
    const normalized = Math.log1p(Math.abs(coeffs[i])) / denominator
    image[i] = Math.pow(normalized, gamma) * 255
  }

  return image
}
