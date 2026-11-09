import { IMAGE_SIZE } from '@core/image'
import GrayCanvas from '@renderer/components/GrayCanvas'
import { formatPsnr, sharePercent } from '@renderer/format'
import type { CompressionView, LoadedImage } from '@renderer/types'

type Props = {
  image: LoadedImage
  view: CompressionView
  dwtLevels: number
}

export default function ImagePanels({ image, view, dwtLevels }: Props): React.JSX.Element {
  return (
    <>
      <div className="panels">
        <GrayCanvas
          gray={image.gray}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          title="Original"
          note="grayscale, normalized"
          saveName="original.png"
        />
        <GrayCanvas
          gray={view.dct.reconstructed}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          title="DCT reconstruction"
          note={`PSNR ${formatPsnr(view.dct.psnr)} · ${sharePercent(view.dct).toFixed(1)}% kept`}
          saveName="dct-reconstruction.png"
        />
        <GrayCanvas
          gray={view.dwt.reconstructed}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          title="DWT reconstruction"
          note={`PSNR ${formatPsnr(view.dwt.psnr)} · ${sharePercent(view.dwt).toFixed(1)}% kept`}
          saveName="dwt-reconstruction.png"
        />
      </div>

      <div className="panels secondary">
        <GrayCanvas
          gray={view.dctSpectrum}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          title="DCT coefficients"
          note="log(1 + |F|), dropped ones are black"
          saveName="dct-coefficients.png"
        />
        <GrayCanvas
          gray={view.dwtSpectrum}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          title="DWT coefficients"
          note={`Haar, ${dwtLevels} level${dwtLevels === 1 ? '' : 's'} · log magnitude`}
          saveName="dwt-coefficients.png"
        />
      </div>
    </>
  )
}
