import { useEffect, useRef } from 'react'
import { grayToRgba } from '@core/image'

type Props = {
  gray: Float32Array
  width: number
  height: number
  title: string
  note?: string
  saveName?: string
}

export default function GrayCanvas({
  gray,
  width,
  height,
  title,
  note,
  saveName,
}: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) return

    context.putImageData(new ImageData(grayToRgba(gray), width, height), 0, 0)
  }, [gray, width, height])

  function handleSave(): void {
    const canvas = canvasRef.current
    if (!canvas || !saveName) return

    canvas.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = saveName
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <figure className="panel">
      <figcaption>
        <span>{title}</span>
        <span className="caption-right">
          {note ? <em>{note}</em> : null}
          {saveName ? (
            <button type="button" className="panel-save" onClick={handleSave}>
              Save
            </button>
          ) : null}
        </span>
      </figcaption>
      <canvas ref={canvasRef} width={width} height={height} />
    </figure>
  )
}
