import { useState } from 'react'

const stack = [
  ['Electron', window.api.versions.electron],
  ['Chromium', window.api.versions.chrome],
  ['Node.js', window.api.versions.node],
  ['V8', window.api.versions.v8],
] as const

export default function App(): React.JSX.Element {
  const [clicks, setClicks] = useState(0)

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Multimedia · Lab 3</p>
        <h1>Electron + Vite + React + TypeScript</h1>
        <p className="lede">
          Stack is wired up. This window is served by Vite with hot reload, rendered by React,
          and hosted by Electron.
        </p>

        <dl className="versions">
          {stack.map(([name, version]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{version}</dd>
            </div>
          ))}
        </dl>

        <div className="row">
          <button type="button" onClick={() => setClicks((n) => n + 1)}>
            React state works
          </button>
          <span className="counter">
            {clicks} {clicks === 1 ? 'click' : 'clicks'}
          </span>
        </div>

        <p className="footnote">
          Platform: {window.api.platform} · Math goes in <code>src/renderer/src/lib/</code>
        </p>
      </section>
    </main>
  )
}
