import { IMAGE_SIZE } from '@core/image'
import { formatPsnr } from '@renderer/format'
import type { CompressionView, LoadedImage } from '@renderer/types'

type Props = {
  image: LoadedImage
  view: CompressionView
}

export default function StatsRow({ image, view }: Props): React.JSX.Element {
  return (
    <div className="stats">
      <div className="stat">
        <span>File</span>
        <strong title={image.name}>{image.name}</strong>
      </div>
      <div className="stat">
        <span>Input</span>
        <strong>
          {IMAGE_SIZE} × {IMAGE_SIZE}
        </strong>
      </div>
      <div className="stat">
        <span>DCT time</span>
        <strong>{view.dctMs.toFixed(0)} ms</strong>
      </div>
      <div className="stat">
        <span>DWT time</span>
        <strong>{view.dwtMs.toFixed(0)} ms</strong>
      </div>
      <div className="stat">
        <span>DCT PSNR</span>
        <strong>{formatPsnr(view.dct.psnr)}</strong>
      </div>
      <div className="stat">
        <span>DWT PSNR</span>
        <strong>{formatPsnr(view.dwt.psnr)}</strong>
      </div>
    </div>
  )
}
