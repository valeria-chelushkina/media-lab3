import type { SweepRow } from '@renderer/types'

type Point = {
  keep: number
  psnr: number
}

function series(rows: SweepRow[], method: SweepRow['method']): Point[] {
  return rows
    .filter((row) => row.method === method && Number.isFinite(row.psnr))
    .sort((a, b) => b.keepPercent - a.keepPercent)
    .map((row) => ({ keep: row.keepPercent, psnr: row.psnr }))
}

const WIDTH = 720
const HEIGHT = 240
const PAD = { left: 52, right: 20, top: 18, bottom: 34 }

export default function PsnrChart({ rows }: { rows: SweepRow[] }): React.JSX.Element {
  const dct = series(rows, 'DCT')
  const dwt = series(rows, 'DWT')
  const points = [...dct, ...dwt]

  if (points.length < 2) {
    return <p className="chart-empty">Need at least two finite PSNR points to plot.</p>
  }

  const keepLabels = [...new Set(points.map((point) => point.keep))].sort((a, b) => b - a)
  const values = points.map((point) => point.psnr)
  const minY = Math.floor(Math.min(...values) - 2)
  const maxY = Math.ceil(Math.max(...values) + 2)
  const rangeY = maxY - minY || 1

  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom

  const x = (keep: number): number => {
    const index = keepLabels.indexOf(keep)
    return PAD.left + (index / Math.max(1, keepLabels.length - 1)) * plotW
  }

  const y = (psnr: number): number =>
    PAD.top + (1 - (psnr - minY) / rangeY) * plotH

  const ticks = Array.from({ length: 5 }, (_, index) => minY + (rangeY * index) / 4)

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="PSNR versus kept share">
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className="chart-grid"
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text className="chart-label" x={PAD.left - 10} y={y(tick) + 4} textAnchor="end">
              {tick.toFixed(0)}
            </text>
          </g>
        ))}

        {keepLabels.map((keep) => (
          <text
            key={keep}
            className="chart-label"
            x={x(keep)}
            y={HEIGHT - 10}
            textAnchor="middle"
          >
            {keep}%
          </text>
        ))}

        <polyline
          className="line-dct"
          points={dct.map((point) => `${x(point.keep)},${y(point.psnr)}`).join(' ')}
        />
        <polyline
          className="line-dwt"
          points={dwt.map((point) => `${x(point.keep)},${y(point.psnr)}`).join(' ')}
        />

        {dct.map((point) => (
          <circle key={`dct-${point.keep}`} className="dot-dct" cx={x(point.keep)} cy={y(point.psnr)} r={3.5} />
        ))}
        {dwt.map((point) => (
          <circle key={`dwt-${point.keep}`} className="dot-dwt" cx={x(point.keep)} cy={y(point.psnr)} r={3.5} />
        ))}
      </svg>

      <div className="chart-legend">
        <span>
          <i className="swatch dct" /> DCT
        </span>
        <span>
          <i className="swatch dwt" /> DWT
        </span>
        <span className="chart-note">100% is lossless (PSNR ∞) and omitted</span>
      </div>
    </div>
  )
}
