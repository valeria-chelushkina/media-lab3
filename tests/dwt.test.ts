import { describe, expect, it } from 'vitest'
import {
  forwardHaar1D,
  forwardHaar2D,
  inverseHaar1D,
  inverseHaar2D,
  maxHaarLevels,
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

describe('forwardHaar1D', () => {
  it('computes the orthonormal low/detail pair', () => {
    const coeffs = forwardHaar1D(Float64Array.from([3, 1]))

    expect(coeffs[0]).toBeCloseTo(4 / Math.SQRT2, 12)
    expect(coeffs[1]).toBeCloseTo(2 / Math.SQRT2, 12)
  })

  it('round-trips', () => {
    const signal = Float64Array.from([85, -65, 15, 30, -56, 35, 90, 60])
    const restored = inverseHaar1D(forwardHaar1D(signal))

    for (let i = 0; i < signal.length; i += 1) {
      expect(restored[i]).toBeCloseTo(signal[i], 12)
    }
  })

  it('rejects odd lengths', () => {
    expect(() => forwardHaar1D(new Float64Array(3))).toThrow()
  })
})

describe('forwardHaar2D (slide 31 layout)', () => {
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

  it('round-trips for every supported level count', () => {
    const size = 32
    const pixels = testImage(size, 11)

    for (let levels = 1; levels <= maxHaarLevels(size, size); levels += 1) {
      const restored = inverseHaar2D(forwardHaar2D(pixels, size, size, levels), size, size, levels)

      for (let i = 0; i < pixels.length; i += 1) {
        expect(restored[i]).toBeCloseTo(pixels[i], 3)
      }
    }
  })

  it('rejects sizes that cannot be split that many times', () => {
    expect(() => forwardHaar2D(new Float32Array(32 * 32), 32, 32, 6)).toThrow()
  })

  it('reports the maximum depth for 512x512', () => {
    expect(maxHaarLevels(512, 512)).toBe(9)
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
