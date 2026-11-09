import { describe, expect, it } from 'vitest'
import { mse, psnr, psnrFromMse } from '@core/metrics'

describe('mse', () => {
  it('is zero for identical images', () => {
    expect(mse(Float32Array.from([0, 10, 255]), Float32Array.from([0, 10, 255]))).toBe(0)
  })

  it('averages squared differences', () => {
    // (1^2 + 2^2 + 3^2) / 3
    expect(mse(Float32Array.from([1, 2, 3]), Float32Array.from([0, 0, 0]))).toBeCloseTo(14 / 3, 10)
  })

  it('compares clamped 8-bit values', () => {
    expect(mse(Float32Array.from([300, -10]), Float32Array.from([255, 0]))).toBe(0)
  })

  it('rejects mismatched sizes', () => {
    expect(() => mse(Float32Array.from([1]), new Float32Array(2))).toThrow()
  })
})

describe('psnr', () => {
  it('is infinite for identical images', () => {
    expect(psnr(Float32Array.from([12, 200]), Float32Array.from([12, 200]))).toBe(
      Number.POSITIVE_INFINITY,
    )
  })

  it('is 48.13 dB when every pixel differs by one', () => {
    expect(psnr(Float32Array.from([1, 2, 3]), Float32Array.from([0, 1, 2]))).toBeCloseTo(48.1308, 3)
  })

  it('grows as the error shrinks', () => {
    const original = Float32Array.from([100, 120, 140, 160])
    const close = Float32Array.from([101, 121, 141, 161])
    const far = Float32Array.from([110, 130, 150, 170])

    expect(psnr(original, close)).toBeGreaterThan(psnr(original, far))
  })

  it('derives from mse without recomputing', () => {
    expect(psnrFromMse(0)).toBe(Number.POSITIVE_INFINITY)
    expect(psnrFromMse(1)).toBeCloseTo(48.1308, 3)
  })
})
