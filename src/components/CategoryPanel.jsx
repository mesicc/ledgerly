import { useState } from 'react'
import { poKategorijama } from '../lib/compute.js'
import { broj, km } from '../lib/format.js'

const PRVIH = 7

export default function CategoryPanel({ stavke, filter, onFilter, skraceno }) {
  const [sve, setSve] = useState(false)
  const { redovi, ukupno } = poKategorijama(stavke)
  const vidljivi = sve ? redovi : redovi.slice(0, PRVIH)
  const maks = redovi[0]?.iznos ?? 0
  const filterJeTrosak = redovi.some((r) => r.key === filter)

  return (
    <>
      <div className="card-head">
        <div>
          <h2 className="card-title">Na šta trošimo</h2>
          <p className="card-sub">Klikni kategoriju da filtriraš stavke</p>
        </div>
      </div>
      <div className="card-body">
        {redovi.length === 0 ? (
          <div className="empty">Nema troškova u ovom periodu.</div>
        ) : (
          <ul className="cat-list">
            {vidljivi.map((r) => {
              const aktivna = filter === r.key
              return (
                <li key={r.key}>
                  <button
                    className={`cat-row${aktivna ? ' active' : ''}${filterJeTrosak && !aktivna ? ' dim' : ''}`}
                    aria-pressed={aktivna}
                    onClick={() => onFilter(aktivna ? null : r.key)}
                    title={`${r.naziv}: ${r.brojStavki} stavki`}
                  >
                    <span className="cat-name">
                      <i className="dot" style={{ background: `var(--cat-${r.key})` }} />
                      <span>{r.naziv}</span>
                    </span>
                    <span className="cat-amount num">
                      {km(r.iznos, { skraceno })}
                      <span className="pct">{broj(r.udio, 1)}%</span>
                    </span>
                    <span className="cat-track" aria-hidden="true">
                      <span
                        className="cat-fill"
                        style={{ display: 'block', width: `${maks ? (r.iznos / maks) * 100 : 0}%` }}
                      />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <div className="panel-note">
          <span>
            Ukupno <b className="num" style={{ color: 'var(--ink)', fontWeight: 500 }}>{km(ukupno, { skraceno })}</b>
          </span>
          <span style={{ display: 'flex', gap: 12 }}>
            {filterJeTrosak && (
              <button className="link-btn" onClick={() => onFilter(null)}>Poništi filter</button>
            )}
            {redovi.length > PRVIH && (
              <button className="link-btn" onClick={() => setSve((s) => !s)}>
                {sve ? 'Prikaži manje' : `Prikaži sve (${redovi.length})`}
              </button>
            )}
          </span>
        </div>
      </div>
    </>
  )
}
