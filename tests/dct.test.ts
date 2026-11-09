import { describe, expect, it } from 'vitest'
import {
  BLOCK_SIZE,
  buildDctMatrix,
  c,
  forwardDct1D,
  forwardDct2D,
  forwardDct8,
} from '@core/dct'

const N = BLOCK_SIZE * BLOCK_SIZE

function sumSquares(values: ArrayLike<number>): number {
  let total = 0
  for (let i = 0; i < values.length; i += 1) total += values[i] * values[i]
  return total
}

/** Slide 17 formula, written out literally for cross-checking the matrix form. */
function referenceDct2D(block: Float64Array): Float64Array {
  const out = new Float64Array(N)

  for (let u = 0; u < BLOCK_SIZE; u += 1) {
    for (let v = 0; v < BLOCK_SIZE; v += 1) {
      let sum = 0

      for (let i = 0; i < BLOCK_SIZE; i += 1) {
        for (let j = 0; j < BLOCK_SIZE; j += 1) {
          sum +=
            Math.cos(((2 * i + 1) * u * Math.PI) / 16) *
            Math.cos(((2 * j + 1) * v * Math.PI) / 16) *
            block[i * BLOCK_SIZE + j]
        }
      }

      out[u * BLOCK_SIZE + v] = ((c(u) * c(v)) / 4) * sum
    }
  }

  return out
}

function pseudoRandomBlock(seed = 7): Float64Array {
  const block = new Float64Array(N)
  let state = seed

  for (let i = 0; i < N; i += 1) {
    state = (state * 16807) % 2147483647
    block[i] = state / 2147483647 - 0.5
  }

  return block
}

describe('basis matrix (slides 18 and 20)', () => {
  it('matches M[u][i] = C(u)/2 * cos((2i+1)u*pi/16) for 8 points', () => {
    const matrix = buildDctMatrix(BLOCK_SIZE)

    for (let u = 0; u < BLOCK_SIZE; u += 1) {
      for (let i = 0; i < BLOCK_SIZE; i += 1) {
        const expected = (c(u) / 2) * Math.cos(((2 * i + 1) * u * Math.PI) / 16)
        expect(matrix[u * BLOCK_SIZE + i]).toBeCloseTo(expected, 12)
      }
    }
  })

  it('is orthonormal', () => {
    const matrix = buildDctMatrix(BLOCK_SIZE)

    for (let k = 0; k < BLOCK_SIZE; k += 1) {
      for (let l = 0; l < BLOCK_SIZE; l += 1) {
        let dot = 0
        for (let x = 0; x < BLOCK_SIZE; x += 1) {
          dot += matrix[k * BLOCK_SIZE + x] * matrix[l * BLOCK_SIZE + x]
        }
        expect(dot).toBeCloseTo(k === l ? 1 : 0, 12)
      }
    }
  })
})

describe('forwardDct1D (slide 18)', () => {
  it('reproduces the worked example from slide 24: F = 69, -49, 74, 11, 16, 117, 44, -5', () => {
    const signal = Float64Array.from([85, -65, 15, 30, -56, 35, 90, 60])
    const expected = [69, -49, 74, 11, 16, 117, 44, -5]
    const coeffs = forwardDct1D(signal)

    expected.forEach((value, u) => {
      expect(coeffs[u]).toBeCloseTo(value, 0)
    })
  })

  it('gives F(0) ≈ 283 for a constant signal of 100 and zero AC (slide 24a)', () => {
    const coeffs = forwardDct1D(new Float64Array(BLOCK_SIZE).fill(100))

    expect(coeffs[0]).toBeCloseTo((Math.SQRT2 / 4) * 800, 10)
    for (let u = 1; u < BLOCK_SIZE; u += 1) {
      expect(Math.abs(coeffs[u])).toBeLessThan(1e-9)
    }
  })
})

describe('forwardDct8 (slide 17)', () => {
  it('equals the literal 2D double sum from the slide', () => {
    const block = pseudoRandomBlock()
    const expected = referenceDct2D(block)
    const coeffs = forwardDct8(block)

    for (let i = 0; i < N; i += 1) {
      expect(coeffs[i]).toBeCloseTo(expected[i], 9)
    }
  })

  it('preserves energy (orthonormal transform)', () => {
    const block = pseudoRandomBlock(11)
    expect(sumSquares(forwardDct8(block))).toBeCloseTo(sumSquares(block), 9)
  })

  it('puts a constant block into DC = 8 * mean, AC = 0 (slide 25)', () => {
    const coeffs = forwardDct8(new Float64Array(N).fill(100))

    expect(coeffs[0]).toBeCloseTo(8 * 100, 9)
    for (let i = 1; i < N; i += 1) {
      expect(Math.abs(coeffs[i])).toBeLessThan(1e-9)
    }
  })
})

describe('forwardDct2D', () => {
  it('transforms each 8x8 block independently without a level shift', () => {
    const width = 16
    const height = 16
    const pixels = new Float32Array(width * height).fill(40)
    const coeffs = forwardDct2D(pixels, width, height)

    for (const [bx, by] of [
      [0, 0],
      [8, 0],
      [0, 8],
      [8, 8],
    ]) {
      // constant 40 block -> DC = 8 * 40 = 320
      expect(coeffs[by * width + bx]).toBeCloseTo(320, 6)
      expect(Math.abs(coeffs[by * width + bx + 1])).toBeLessThan(1e-9)
    }
  })
})
