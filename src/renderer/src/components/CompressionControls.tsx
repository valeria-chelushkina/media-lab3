const DWT_LEVEL_OPTIONS = [1, 2, 3, 4]

type Props = {
  keepPercent: number
  onKeepPercentChange: (value: number) => void
  dwtLevels: number
  onDwtLevelsChange: (value: number) => void
  pending: boolean
  dctThreshold: number
  dwtThreshold: number
}

export default function CompressionControls({
  keepPercent,
  onKeepPercentChange,
  dwtLevels,
  onDwtLevelsChange,
  pending,
  dctThreshold,
  dwtThreshold,
}: Props): React.JSX.Element {
  return (
    <div className="controls">
      <div className="slider-row">
        <label htmlFor="keep">Keep largest coefficients</label>
        <input
          id="keep"
          type="range"
          min={1}
          max={100}
          step={1}
          value={keepPercent}
          onChange={(event) => onKeepPercentChange(Number(event.target.value))}
        />
        <output htmlFor="keep">{keepPercent}%</output>
      </div>

      <div className="option-row">
        <label htmlFor="levels">Haar decomposition levels</label>
        <select
          id="levels"
          value={dwtLevels}
          onChange={(event) => onDwtLevelsChange(Number(event.target.value))}
        >
          {DWT_LEVEL_OPTIONS.map((levels) => (
            <option key={levels} value={levels}>
              {levels}
            </option>
          ))}
        </select>
      </div>

      <p className="controls-hint">
        {pending
          ? 'Recomputing…'
          : `Threshold — DCT ${dctThreshold.toFixed(1)} · DWT ${dwtThreshold.toFixed(1)}`}
      </p>
    </div>
  )
}
