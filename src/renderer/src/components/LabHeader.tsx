import type { ChangeEvent } from 'react'

type Props = {
  busy: boolean
  hasImage: boolean
  onFile: (file: File) => void
}

export default function LabHeader({ busy, hasImage, onFile }: Props): React.JSX.Element {
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    if (file) onFile(file)
    event.target.value = ''
  }

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Multimedia · Lab 3</p>
        <h1>DCT vs DWT — lossy compression</h1>
        <p className="subtitle">
          Photo → 512×512 grayscale → 8×8 block DCT or Haar DWT → keep the largest
          coefficients → inverse transform. PSNR shows what the dropped coefficients cost.
        </p>
      </div>

      <label className={`file-button${busy ? ' is-busy' : ''}`}>
        <input type="file" accept="image/*" disabled={busy} onChange={handleChange} />
        {busy ? 'Working…' : hasImage ? 'Load another photo' : 'Load photo'}
      </label>
    </header>
  )
}
