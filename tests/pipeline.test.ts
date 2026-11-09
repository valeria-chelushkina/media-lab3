import { describe, expect, it } from 'vitest'
import { IMAGE_SIZE } from '@core/image'
import { runDct, runDwt } from '@core/pipeline'

function testImage(size: number): Float32Array {
  const pixels = new Float32Array(size * size)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      pixels[y * size + x] = (x * 7 + y * 3 + ((x * y) % 31)) % 256
    }
  }

  return pixels
}

describe('runDct', () => {
  const size = IMAGE_SIZE / 16 // 32x32, still divisible into 8x8 blocks

  it('is lossless at 100% and reports infinite PSNR', () => {
    const image = testImage(size)
    const result = runDct(image, size, size, 1)

    expect(result.psnr).toBe(Number.POSITIVE_INFINITY)
    expect(result.mse).toBe(0)
    // 100% keeps every coefficient; `kept` counts non-zero ones, which can be
    // slightly below the total if the transform produced exact zeros.
    expect(result.kept).toBeGreaterThan(0)
    expect(result.kept).toBeLessThanOrEqual(result.total)

    for (let i = 0; i < image.length; i += 1) {
      expect(result.reconstructed[i]).toBeCloseTo(image[i], 3)
    }
  })

  it('drops coefficients and lowers PSNR as the share shrinks', () => {
    const image = testImage(size)
    const half = runDct(image, size, size, 0.5)
    const quarter = runDct(image, size, size, 0.25)
    const none = runDct(image, size, size, 0)

    expect(half.kept).toBeGreaterThan(quarter.kept)
    expect(quarter.kept).toBeGreaterThan(0)
    expect(half.psnr).toBeGreaterThan(quarter.psnr)
    expect(quarter.psnr).toBeGreaterThan(none.psnr)
    expect(none.kept).toBe(0)
  })

  it('returns coefficients matching the image size', () => {
    const result = runDct(testImage(size), size, size, 0.1)

    expect(result.total).toBe(size * size)
    expect(result.coeffs.length).toBe(size * size)
    expect(result.reconstructed.length).toBe(size * size)
    expect(result.threshold).toBeGreaterThan(0)
  })
})

describe('runDwt', () => {
  const size = IMAGE_SIZE / 16

  it('is lossless at 100% and reports infinite PSNR', () => {
    const image = testImage(size)
    const result = runDwt(image, size, size, 1)

    expect(result.psnr).toBe(Number.POSITIVE_INFINITY)
    expect(result.mse).toBe(0)
    expect(result.kept).toBeGreaterThan(0)
    expect(result.kept).toBeLessThanOrEqual(result.total)

    for (let i = 0; i < image.length; i += 1) {
      expect(result.reconstructed[i]).toBeCloseTo(image[i], 3)
    }
  })

  it('drops coefficients and lowers PSNR as the share shrinks', () => {
    const image = testImage(size)
    const half = runDwt(image, size, size, 0.5, 3)
    const quarter = runDwt(image, size, size, 0.25, 3)
    const none = runDwt(image, size, size, 0, 3)

    expect(half.kept).toBeGreaterThan(quarter.kept)
    expect(quarter.kept).toBeGreaterThan(0)
    expect(half.psnr).toBeGreaterThan(quarter.psnr)
    expect(quarter.psnr).toBeGreaterThan(none.psnr)
    expect(none.kept).toBe(0)
  })

  it('supports different decomposition levels', () => {
    const image = testImage(size)
    const shallow = runDwt(image, size, size, 0.25, 1)
    const deep = runDwt(image, size, size, 0.25, 3)

    expect(shallow.total).toBe(size * size)
    expect(deep.total).toBe(size * size)
    expect(Number.isFinite(shallow.psnr)).toBe(true)
    expect(Number.isFinite(deep.psnr)).toBe(true)
  })
})
