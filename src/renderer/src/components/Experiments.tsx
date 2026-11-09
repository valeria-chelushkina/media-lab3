import PsnrChart from '@renderer/components/PsnrChart'
import ResultsTable, { downloadResultsCsv } from '@renderer/components/ResultsTable'
import type { SweepRow } from '@renderer/types'

type Props = {
  rows: SweepRow[] | null
  running: boolean
  levels: number
  onRun: () => void
}

export default function Experiments({ rows, running, levels, onRun }: Props): React.JSX.Element {
  return (
    <section className="sweep">
      <div className="sweep-head">
        <div>
          <h2>Experiments</h2>
          <p className="sweep-hint">
            100 / 50 / 25 / 10 / 5% for both methods · {levels} Haar level
            {levels === 1 ? '' : 's'}
          </p>
        </div>
        <div className="sweep-actions">
          <button type="button" onClick={onRun} disabled={running}>
            {running ? 'Running…' : 'Run sweep'}
          </button>
          {rows ? (
            <button type="button" className="ghost" onClick={() => downloadResultsCsv(rows)}>
              Export CSV
            </button>
          ) : null}
        </div>
      </div>

      {rows ? (
        <>
          <PsnrChart rows={rows} />
          <ResultsTable rows={rows} />
        </>
      ) : (
        <p className="sweep-empty">
          Runs the five keep levels for DCT and DWT and records kept coefficients, PSNR and
          the estimated ratio.
        </p>
      )}
    </section>
  )
}
