import { useEffect, useRef } from 'react'
import { grayToRgba } from '@core/image'

type Props = {
  gray: Float32Array
  width: number
  height: number
  title: string
  note?: string
}

export default function GrayCanvas({ gray, width, height, title, note }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) return

    context.putImageData(new ImageData(grayToRgba(gray), width, height), 0, 0)
  }, [gray, width, height])

  return (
    <figure className="panel">
      <figcaption>
        <span>{title}</span>
        {note ? <em>{note}</em> : null}
      </figcaption>
      <canvas ref={canvasRef} width={width} height={height} />
    </figure>
  )
}
