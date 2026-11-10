import { describe, expect, it } from 'vitest'
import {
  forwardHaar2D,
  inverseHaar2D,
} from '@core/dwt'

function energy(values: ArrayLike<number>): number {
  let total = 0
  for (let i = 0; i < values.length; i += 1) total += values[i] * values[i]
  return total
}

function testImage(size: number, seed = 7): Float32Array {
  const pixels = new Float32Array(size * size)
  let state = seed

  for (let i = 0; i < pixels.length; i += 1) {
    state = (state * 16807) % 2147483647
    pixels[i] = (state / 2147483647) * 255
  }

  return pixels
}

describe('forwardHaar2D', () => {
  it('puts a constant image entirely into LL', () => {
    const size = 8
    const pixels = new Float32Array(size * size).fill(100)
    const coeffs = forwardHaar2D(pixels, size, size, 3)

    // LL = 2^levels * mean for a constant block
    expect(coeffs[0]).toBeCloseTo(800, 9)
    for (let i = 1; i < coeffs.length; i += 1) {
      expect(Math.abs(coeffs[i])).toBeLessThan(1e-9)
    }
  })

  it('preserves energy (orthonormal wavelet)', () => {
    const size = 32
    const pixels = testImage(size)
    expect(energy(forwardHaar2D(pixels, size, size, 3))).toBeCloseTo(energy(pixels), 6)
  })

  it('rejects sizes that cannot be split that many times', () => {
    expect(() => forwardHaar2D(new Float32Array(32 * 32), 32, 32, 6)).toThrow()
  })

})

describe('inverseHaar2D', () => {
  it('turns an LL-only constant back into a constant image', () => {
    const size = 8
    const coeffs = new Float64Array(size * size)
    coeffs[0] = 800

    const restored = inverseHaar2D(coeffs, size, size, 3)

    for (let i = 0; i < restored.length; i += 1) {
      expect(restored[i]).toBeCloseTo(100, 6)
    }
  })
})
