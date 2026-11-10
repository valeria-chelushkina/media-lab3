/**
 * 2D Haar wavelet transform (orthonormal)
 * 
 *   LL | HL
 *   -------   LL = reduced copy (low frequencies)
 *   LH | HH   HL, LH, HH = vertical, horizontal and diagonal details
 *
 * One level halves the image; the LL quadrant is decomposed again for the next
 * level.
 *
 * 1D pair (orthonormal, so the inverse needs no extra scaling):
 *   a[i] = (x[2i] + x[2i+1]) / sqrt(2)
 *   d[i] = (x[2i] - x[2i+1]) / sqrt(2)
 *   x[2i]     = (a[i] + d[i]) / sqrt(2)
 *   x[2i + 1] = (a[i] - d[i]) / sqrt(2)
 */

const INV_SQRT2 = Math.SQRT1_2

export const HAAR_LEVELS = 3

function assertLevels(width: number, height: number, levels: number): void {
  if (!Number.isInteger(levels) || levels < 0) {
    throw new Error(`Invalid Haar level count: ${levels}.`)
  }

  const factor = 2 ** levels
  if (width % factor !== 0 || height % factor !== 0) {
    throw new Error(`Image size ${width}x${height} is not divisible by 2^${levels}.`)
  }
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

// Forward 2D Haar transform of a whole image.
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

// Inverse 2D Haar transform; returns pixel values (unclamped).
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
