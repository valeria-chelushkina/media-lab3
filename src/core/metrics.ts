// Image quality metrics used for the DCT / DWT comparison.

const MAX_VALUE = 255

function toByte(value: number): number {
  if (value < 0) return 0
  if (value > MAX_VALUE) return MAX_VALUE
  return Math.round(value)
}

export function mse(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) {
    throw new Error(`Size mismatch: ${a.length} vs ${b.length}.`)
  }

  let sum = 0
  for (let i = 0; i < a.length; i += 1) {
    const diff = toByte(a[i]) - toByte(b[i])
    sum += diff * diff
  }

  return sum / a.length
}

export function psnrFromMse(meanSquaredError: number): number {
  if (meanSquaredError === 0) return Number.POSITIVE_INFINITY
  return 10 * Math.log10((MAX_VALUE * MAX_VALUE) / meanSquaredError)
}

export function psnr(a: ArrayLike<number>, b: ArrayLike<number>): number {
  return psnrFromMse(mse(a, b))
}
