export type SweepRow = {
  method: 'DCT' | 'DWT'
  keepPercent: number
  kept: number
  total: number
  psnr: number
}

function formatPsnr(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)} dB` : '∞ dB'
}

function estimatedRatio(row: SweepRow): string {
  return row.kept === 0 ? '∞' : `${(row.total / row.kept).toFixed(1)}×`
}

/** Builds and downloads the experiment table as CSV. */
export function downloadResultsCsv(rows: SweepRow[]): void {
  const header = [
    'method',
    'keep_percent',
    'kept',
    'total',
    'share_percent',
    'psnr_db',
    'estimated_ratio',
  ]

  const lines = rows.map((row) => {
    const share = row.total > 0 ? ((row.kept / row.total) * 100).toFixed(2) : '0'
    return [
      row.method,
      row.keepPercent,
      row.kept,
      row.total,
      share,
      Number.isFinite(row.psnr) ? row.psnr.toFixed(3) : 'inf',
      row.kept === 0 ? 'inf' : (row.total / row.kept).toFixed(3),
    ].join(',')
  })

  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'dct-dwt-results.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function ResultsTable({ rows }: { rows: SweepRow[] }): React.JSX.Element {
  return (
    <div className="table-wrap">
      <table className="results">
        <thead>
          <tr>
            <th>Method</th>
            <th>Keep</th>
            <th>Kept</th>
            <th>Share</th>
            <th>PSNR</th>
            <th>Est. ratio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.method}-${row.keepPercent}`}>
              <td className="method">{row.method}</td>
              <td>{row.keepPercent}%</td>
              <td>{row.kept.toLocaleString()}</td>
              <td>{((row.kept / row.total) * 100).toFixed(1)}%</td>
              <td>{formatPsnr(row.psnr)}</td>
              <td>{estimatedRatio(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
