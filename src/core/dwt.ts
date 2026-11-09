/**
 * 2D Haar wavelet transform (orthonormal), matching the subband layout from
 * learn/Multi_11.pdf slide 31:
 *
 *   LL | HL
 *   -------   LL = reduced copy (low frequencies)
 *   LH | HH   HL, LH, HH = vertical, horizontal and diagonal details
 *
 * One level halves the image; the LL quadrant is decomposed again for the next
 * level (the slides mention up to 5 levels, we allow 1-4 in the UI).
 *
 * 1D pair (orthonormal, so the inverse needs no extra scaling):
 *   a[i] = (x[2i] + x[2i+1]) / sqrt(2)
 *   d[i] = (x[2i] - x[2i+1]) / sqrt(2)
 *   x[2i]     = (a[i] + d[i]) / sqrt(2)
 *   x[2i + 1] = (a[i] - d[i]) / sqrt(2)
 */

const INV_SQRT2 = Math.SQRT1_2

export const HAAR_LEVELS = 3

/** Maximum useful decomposition depth for the given size. */
export function maxHaarLevels(width: number, height: number): number {
  return Math.floor(Math.log2(Math.min(width, height)))
}

function assertLevels(width: number, height: number, levels: number): void {
  if (!Number.isInteger(levels) || levels < 0) {
    throw new Error(`Invalid Haar level count: ${levels}.`)
  }

  const factor = 2 ** levels
  if (width % factor !== 0 || height % factor !== 0) {
    throw new Error(`Image size ${width}x${height} is not divisible by 2^${levels}.`)
  }
}

/** Forward 1D Haar transform: lows in the first half, details in the second. */
export function forwardHaar1D(signal: Float64Array): Float64Array {
  if (signal.length === 0 || signal.length % 2 !== 0) {
    throw new Error(`Expected an even number of samples, got ${signal.length}.`)
  }

  const half = signal.length / 2
  const out = new Float64Array(signal.length)

  for (let i = 0; i < half; i += 1) {
    const a = signal[2 * i]
    const b = signal[2 * i + 1]
    out[i] = (a + b) * INV_SQRT2
    out[half + i] = (a - b) * INV_SQRT2
  }

  return out
}

/** Inverse 1D Haar transform. */
export function inverseHaar1D(coeffs: Float64Array): Float64Array {
  if (coeffs.length === 0 || coeffs.length % 2 !== 0) {
    throw new Error(`Expected an even number of coefficients, got ${coeffs.length}.`)
  }

  const half = coeffs.length / 2
  const out = new Float64Array(coeffs.length)

  for (let i = 0; i < half; i += 1) {
    const a = coeffs[i]
    const d = coeffs[half + i]
    out[2 * i] = (a + d) * INV_SQRT2
    out[2 * i + 1] = (a - d) * INV_SQRT2
  }

  return out
}

function forwardRows(data: Float64Array, width: number, height: number, level: number): void {
  const w = width >> level
  const h = height >> level
  const half = w >> 1
  const row = new Float64Array(w)

  for (let y = 0; y < h; y += 1) {
    const base = y * width
    for (let x = 0; x < w; x += 1) row[x] = data[base + x]

    for (let i = 0; i < half; i += 1) {
      const a = row[2 * i]
      const b = row[2 * i + 1]
      data[base + i] = (a + b) * INV_SQRT2
      data[base + half + i] = (a - b) * INV_SQRT2
    }
  }
}

function forwardColumns(data: Float64Array, width: number, height: number, level: number): void {
  const w = width >> level
  const h = height >> level
  const half = h >> 1
  const column = new Float64Array(h)

  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) column[y] = data[y * width + x]

    for (let i = 0; i < half; i += 1) {
      const a = column[2 * i]
      const b = column[2 * i + 1]
      data[i * width + x] = (a + b) * INV_SQRT2
      data[(half + i) * width + x] = (a - b) * INV_SQRT2
    }
  }
}

function inverseColumns(data: Float64Array, width: number, height: number, level: number): void {
  const w = width >> level
  const h = height >> level
  const half = h >> 1
  const column = new Float64Array(h)

  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) column[y] = data[y * width + x]

    for (let i = 0; i < half; i += 1) {
      const a = column[i]
      const d = column[half + i]
      data[2 * i * width + x] = (a + d) * INV_SQRT2
      data[(2 * i + 1) * width + x] = (a - d) * INV_SQRT2
    }
  }
}

function inverseRows(data: Float64Array, width: number, height: number, level: number): void {
  const w = width >> level
  const h = height >> level
  const half = w >> 1
  const row = new Float64Array(w)

  for (let y = 0; y < h; y += 1) {
    const base = y * width
    for (let x = 0; x < w; x += 1) row[x] = data[base + x]

    for (let i = 0; i < half; i += 1) {
      const a = row[i]
      const d = row[half + i]
      data[base + 2 * i] = (a + d) * INV_SQRT2
      data[base + 2 * i + 1] = (a - d) * INV_SQRT2
    }
  }
}

/** Forward 2D Haar transform of a whole image. */
export function forwardHaar2D(
  pixels: Float32Array | Float64Array,
  width: number,
  height: number,
  levels: number = HAAR_LEVELS,
): Float64Array {
  assertLevels(width, height, levels)

  const data = Float64Array.from(pixels)

  for (let level = 0; level < levels; level += 1) {
    forwardRows(data, width, height, level)
    forwardColumns(data, width, height, level)
  }

  return data
}

/** Inverse 2D Haar transform; returns pixel values (unclamped). */
export function inverseHaar2D(
  coeffs: Float64Array,
  width: number,
  height: number,
  levels: number = HAAR_LEVELS,
): Float32Array {
  assertLevels(width, height, levels)

  const data = Float64Array.from(coeffs)

  for (let level = levels - 1; level >= 0; level -= 1) {
    inverseColumns(data, width, height, level)
    inverseRows(data, width, height, level)
  }

  return Float32Array.from(data)
}
