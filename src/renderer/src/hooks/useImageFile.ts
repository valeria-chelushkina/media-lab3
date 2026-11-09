import { useState } from 'react'
import type { DragEvent } from 'react'
import { IMAGE_SIZE } from '@core/image'
import { loadImageToGray } from '@renderer/services/imageFiles'
import type { LoadedImage } from '@renderer/types'

export type DropHandlers = {
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
}

export function useImageFile(): {
  image: LoadedImage | null
  error: string | null
  busy: boolean
  dragging: boolean
  loadFile: (file: File) => Promise<void>
  dropHandlers: DropHandlers
} {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function loadFile(file: File): Promise<void> {
    setBusy(true)
    setError(null)

    try {
      const gray = await loadImageToGray(file, IMAGE_SIZE)
      setImage({ name: file.name, gray })
    } catch (cause) {
      setImage(null)
      setError(cause instanceof Error ? cause.message : 'Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  const dropHandlers: DropHandlers = {
    onDragOver: (event) => {
      event.preventDefault()
      setDragging(true)
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event) => {
      event.preventDefault()
      setDragging(false)

      const file = event.dataTransfer.files?.[0]
      if (file) void loadFile(file)
    },
  }

  return { image, error, busy, dragging, loadFile, dropHandlers }
}
