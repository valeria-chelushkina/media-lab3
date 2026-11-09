import { describe, expect, it } from 'vitest'
import { keepLargest } from '@core/compress'

function ramp(length: number): Float64Array {
  // magnitudes 1..length, all distinct
  return Float64Array.from({ length }, (_, i) => i + 1)
}

describe('keepLargest', () => {
  it('keeps the requested share and drops the smallest magnitudes', () => {
    const result = keepLargest(ramp(1000), 0.25)

    expect(result.total).toBe(1000)
    expect(result.kept).toBe(250)
    expect(result.threshold).toBe(751)
    expect(result.coeffs[999]).toBe(1000) // largest survives
    expect(result.coeffs[0]).toBe(0) // smallest is dropped
    expect(result.coeffs[750]).toBe(751) // first kept value
    expect(result.coeffs[749]).toBe(0) // last dropped value
  })

  it('keeps everything at 100%', () => {
    const input = ramp(64)
    const result = keepLargest(input, 1)

    expect(result.kept).toBe(64)
    expect(result.threshold).toBe(0)
    expect(Array.from(result.coeffs)).toEqual(Array.from(input))
  })

  it('drops everything at 0%', () => {
    const result = keepLargest(ramp(64), 0)

    expect(result.kept).toBe(0)
    expect(result.coeffs.every((value) => value === 0)).toBe(true)
  })

  it('clamps out-of-range fractions', () => {
    expect(keepLargest(ramp(10), 2).kept).toBe(10)
    expect(keepLargest(ramp(10), -1).kept).toBe(0)
  })

  it('does not mutate the input', () => {
    const input = ramp(16)
    keepLargest(input, 0.5)
    expect(Array.from(input)).toEqual(Array.from(ramp(16)))
  })

  it('handles an all-zero input without over-reporting', () => {
    const result = keepLargest(new Float64Array(16), 0.5)
    expect(result.kept).toBe(0)
    expect(result.threshold).toBe(0)
  })
})
