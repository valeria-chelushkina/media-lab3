/**
 * Minimal square-matrix helpers.
 * Matrices are flat row-major Float64Arrays of size n * n.
 * Kept dependency-free on purpose: the transforms must be our own.
 */

/** Returns a * b for two n x n matrices. */
export function multiply(a: Float64Array, b: Float64Array, n: number): Float64Array {
  const out = new Float64Array(n * n)

  for (let i = 0; i < n; i += 1) {
    for (let k = 0; k < n; k += 1) {
      const aik = a[i * n + k]
      if (aik === 0) continue

      for (let j = 0; j < n; j += 1) {
        out[i * n + j] += aik * b[k * n + j]
      }
    }
  }

  return out
}

/** Returns matrix * vector for an n x n matrix and an n-vector. */
export function multiplyVector(
  matrix: Float64Array,
  vector: Float64Array,
  n: number,
): Float64Array {
  const out = new Float64Array(n)

  for (let i = 0; i < n; i += 1) {
    let sum = 0
    for (let j = 0; j < n; j += 1) {
      sum += matrix[i * n + j] * vector[j]
    }
    out[i] = sum
  }

  return out
}

/** Returns the transpose of an n x n matrix. */
export function transpose(a: Float64Array, n: number): Float64Array {
  const out = new Float64Array(n * n)

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      out[j * n + i] = a[i * n + j]
    }
  }

  return out
}
