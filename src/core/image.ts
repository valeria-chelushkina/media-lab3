/** Grayscale pixel helpers. DOM-free so they can run under plain Node. */

/** Every image is normalized to this size before any transform. */
export const IMAGE_SIZE = 512

/** BT.601 luma from RGBA bytes -> one float per pixel in 0..255. */
export function rgbaToGray(rgba: Uint8ClampedArray, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height)

  for (let i = 0, p = 0; i < gray.length; i += 1, p += 4) {
    gray[i] = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]
  }

  return gray
}

/** One float per pixel -> RGBA bytes, clamped to 0..255. */
export function grayToRgba(gray: Float32Array): Uint8ClampedArray<ArrayBuffer> {
  const rgba = new Uint8ClampedArray(gray.length * 4)

  for (let i = 0, p = 0; i < gray.length; i += 1, p += 4) {
    const value = gray[i] < 0 ? 0 : gray[i] > 255 ? 255 : Math.round(gray[i])
    rgba[p] = value
    rgba[p + 1] = value
    rgba[p + 2] = value
    rgba[p + 3] = 255
  }

  return rgba
}
