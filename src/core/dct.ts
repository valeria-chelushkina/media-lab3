/**
 * Forward DCT-II.
 *
 * 2D:
 *   F(u, v) = C(u) * C(v) / 4
 *             * sum_{i=0}^{7} sum_{j=0}^{7}
 *                 cos((2i + 1) * u * pi / 16)
 *                 * cos((2j + 1) * v * pi / 16)
 *                 * f(i, j)
 *
 * where
 *   C(xi) = sqrt(2)/2  if xi = 0,
 *   C(xi) = 1          otherwise.
 *
 * 2D transform is computed as F = M * B * M^T with
 *   M[u][i] = C(u)/2 * cos((2i + 1) * u * pi / 16).
 */
import { multiply, transpose } from '@core/matrix'

export const BLOCK_SIZE = 8

// C(xi): sqrt(2)/2 for xi = 0, 1 otherwise
export function c(xi: number): number {
  return xi === 0 ? Math.SQRT1_2 : 1
}

/**
 * Row u is the u-th basis function sampled at i = 0..N-1; for N = 8 this is
 * M[u][i] = C(u)/2 * cos((2i + 1) * u * pi / 16).
 */
export function buildDctMatrix(n: number = BLOCK_SIZE): Float64Array {
  const matrix = new Float64Array(n * n)
  const scale = Math.sqrt(2 / n)

  for (let u = 0; u < n; u += 1) {
    for (let i = 0; i < n; i += 1) {
      matrix[u * n + i] = scale * c(u) * Math.cos(((2 * i + 1) * u * Math.PI) / (2 * n))
    }
  }

  return matrix
}

const DCT_MATRIX = buildDctMatrix(BLOCK_SIZE)
const DCT_MATRIX_T = transpose(DCT_MATRIX, BLOCK_SIZE)

// 2D forward DCT of one 8x8 block: F = M * B * M^T.
export function forwardDct8(block: Float64Array): Float64Array {
  if (block.length !== BLOCK_SIZE * BLOCK_SIZE) {
    throw new Error(`Expected a ${BLOCK_SIZE}x${BLOCK_SIZE} block, got ${block.length} values.`)
  }

  return multiply(multiply(DCT_MATRIX, block, BLOCK_SIZE), DCT_MATRIX_T, BLOCK_SIZE)
}

/**
 * Forward DCT of a whole image, block by block.
 * Coefficients are written back at the same positions, so the result is a
 * 512x512 "mosaic" of 8x8 spectra.
 */
export function forwardDct2D(pixels: Float32Array, width: number, height: number): Float64Array {
  if (width % BLOCK_SIZE !== 0 || height % BLOCK_SIZE !== 0) {
    throw new Error(`Image size ${width}x${height} is not divisible by ${BLOCK_SIZE}.`)
  }

  const coeffs = new Float64Array(width * height)
  const block = new Float64Array(BLOCK_SIZE * BLOCK_SIZE)

  for (let by = 0; by < height; by += BLOCK_SIZE) {
    for (let bx = 0; bx < width; bx += BLOCK_SIZE) {
      for (let y = 0; y < BLOCK_SIZE; y += 1) {
        for (let x = 0; x < BLOCK_SIZE; x += 1) {
          block[y * BLOCK_SIZE + x] = pixels[(by + y) * width + bx + x]
        }
      }

      const transformed = forwardDct8(block)

      for (let y = 0; y < BLOCK_SIZE; y += 1) {
        for (let x = 0; x < BLOCK_SIZE; x += 1) {
          coeffs[(by + y) * width + bx + x] = transformed[y * BLOCK_SIZE + x]
        }
      }
    }
  }

  return coeffs
}

/**
 * 2D inverse DCT of one 8x8 block:
 *   f(i, j) = sum_u sum_v C(u)C(v)/4
 *             * cos((2i + 1)u pi / 16) * cos((2j + 1)v pi / 16) * F(u, v)
 * Matrix form: B = M^T * F * M.
 */
export function inverseDct8(coeffs: Float64Array): Float64Array {
  if (coeffs.length !== BLOCK_SIZE * BLOCK_SIZE) {
    throw new Error(`Expected a ${BLOCK_SIZE}x${BLOCK_SIZE} block, got ${coeffs.length} values.`)
  }

  return multiply(multiply(DCT_MATRIX_T, coeffs, BLOCK_SIZE), DCT_MATRIX, BLOCK_SIZE)
}

/**
 * Inverse DCT of a whole coefficient image, block by block.
 * Returns raw pixel values; clamping to 0..255 is a rendering concern, just as
 * the forward transform takes f(i, j) without a level shift.
 */
export function inverseDct2D(
  coeffs: Float64Array,
  width: number,
  height: number,
): Float32Array {
  if (width % BLOCK_SIZE !== 0 || height % BLOCK_SIZE !== 0) {
    throw new Error(`Image size ${width}x${height} is not divisible by ${BLOCK_SIZE}.`)
  }

  const pixels = new Float32Array(width * height)
  const block = new Float64Array(BLOCK_SIZE * BLOCK_SIZE)

  for (let by = 0; by < height; by += BLOCK_SIZE) {
    for (let bx = 0; bx < width; bx += BLOCK_SIZE) {
      for (let y = 0; y < BLOCK_SIZE; y += 1) {
        for (let x = 0; x < BLOCK_SIZE; x += 1) {
          block[y * BLOCK_SIZE + x] = coeffs[(by + y) * width + bx + x]
        }
      }

      const restored = inverseDct8(block)

      for (let y = 0; y < BLOCK_SIZE; y += 1) {
        for (let x = 0; x < BLOCK_SIZE; x += 1) {
          pixels[(by + y) * width + bx + x] = restored[y * BLOCK_SIZE + x]
        }
      }
    }
  }

  return pixels
}
