/** Decodes a user-picked file into a normalized 512x512 grayscale array. */
import { IMAGE_SIZE, rgbaToGray } from '@core/image'

export async function loadImageToGray(file: File, size: number = IMAGE_SIZE): Promise<Float32Array> {
  let bitmap: ImageBitmap

  try {
    bitmap = await createImageBitmap(file, {
      resizeWidth: size,
      resizeHeight: size,
      resizeQuality: 'high',
    })
  } catch {
    throw new Error('Could not decode that file as an image.')
  }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas 2D is not available.')

    context.drawImage(bitmap, 0, 0, size, size)
    const { data } = context.getImageData(0, 0, size, size)
    return rgbaToGray(data, size, size)
  } finally {
    bitmap.close()
  }
}
