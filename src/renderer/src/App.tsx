import { useState } from 'react'
import CompressionControls from '@renderer/components/CompressionControls'
import EmptyState from '@renderer/components/EmptyState'
import Experiments from '@renderer/components/Experiments'
import ImagePanels from '@renderer/components/ImagePanels'
import LabHeader from '@renderer/components/LabHeader'
import StatsRow from '@renderer/components/StatsRow'
import { useCompressionView } from '@renderer/hooks/useCompressionView'
import { useImageFile } from '@renderer/hooks/useImageFile'
import { useSweep } from '@renderer/hooks/useSweep'

export default function App(): React.JSX.Element {
  const { image, error, busy, dragging, loadFile, dropHandlers } = useImageFile()
  const [keepPercent, setKeepPercent] = useState(25)
  const [dwtLevels, setDwtLevels] = useState(3)

  const { view, pending } = useCompressionView(image, keepPercent, dwtLevels)
  const sweep = useSweep(image, dwtLevels)

  return (
    <div className={`shell${dragging ? ' is-dragging' : ''}`} {...dropHandlers}>
      <LabHeader busy={busy} hasImage={image !== null} onFile={loadFile} />

      {error ? <p className="error">{error}</p> : null}

      {image && view ? (
        <>
          <CompressionControls
            keepPercent={keepPercent}
            onKeepPercentChange={setKeepPercent}
            dwtLevels={dwtLevels}
            onDwtLevelsChange={setDwtLevels}
            pending={pending}
            dctThreshold={view.dct.threshold}
            dwtThreshold={view.dwt.threshold}
          />

          <StatsRow image={image} view={view} />
          <ImagePanels image={image} view={view} dwtLevels={dwtLevels} />

          <Experiments
            rows={sweep.rows}
            running={sweep.running}
            levels={dwtLevels}
            onRun={sweep.run}
          />
        </>
      ) : (
        <EmptyState />
      )}

      <footer className="footnote">
        Own DCT (matrix form) and Haar DWT · adjustable coefficient dropping · PSNR + experiments
      </footer>
    </div>
  )
}
