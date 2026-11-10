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

export function transpose(a: Float64Array, n: number): Float64Array {
  const out = new Float64Array(n * n)

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      out[j * n + i] = a[i * n + j]
    }
  }

  return out
}
