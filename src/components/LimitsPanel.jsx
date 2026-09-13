import { limiti } from '../lib/compute.js'
import { broj, km } from '../lib/format.js'
import { naslovLimita } from '../lib/period.js'

const PODNASLOV = {
  month: 'Potrošnja u odnosu na plan',
  quarter: 'Mjesečni limit × 3',
  year: 'Mjesečni limit × 12, za cijelu godinu',
}

export default function LimitsPanel({ stavke, zrno, skraceno }) {
  const redovi = limiti(stavke, zrno)
  const preko = redovi.filter((r) => r.stanje === 'preko').length
  const blizu = redovi.filter((r) => r.stanje === 'blizu').length

  return (
    <>
      <div className="card-head">
        <div>
          <h2 className="card-title">{naslovLimita(zrno)}</h2>
          <p className="card-sub">{PODNASLOV[zrno]}</p>
        </div>
        <div className="limit-summary">
          {preko > 0 && <span style={{ color: 'var(--danger)' }}><b>{preko}</b> preko</span>}
          {blizu > 0 && <span style={{ color: 'var(--warn)' }}><b>{blizu}</b> blizu</span>}
          {preko === 0 && blizu === 0 && <span style={{ color: 'var(--income-text)' }}>Sve u okviru</span>}
        </div>
      </div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        {redovi.map((r) => (
          <div key={r.key} className={`limit ${r.stanje}`}>
            <div className="limit-top">
              <span className="cat-name">
                <i className="dot" style={{ background: `var(--cat-${r.key})` }} />
                <span>{r.naziv}</span>
              </span>
              <span className="limit-amt num">
                <b>{km(r.iznos, { skraceno, valuta: false })}</b> / {km(r.limit, { skraceno })}
              </span>
            </div>
            <div
              className="limit-track"
              role="progressbar"
              aria-label={`${r.naziv}: ${broj(r.udio, 0)} % limita`}
              aria-valuenow={Math.round(r.udio)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="limit-fill" style={{ width: `${Math.min(r.udio, 100)}%` }} />
            </div>
            <div className="limit-status">
              <span className="st">
                {r.stanje === 'preko' ? 'Preko limita' : r.stanje === 'blizu' ? 'Blizu limita' : 'U redu'}
                <span className="num" style={{ marginLeft: 6, fontWeight: 400 }}>{broj(r.udio, 0)} %</span>
              </span>
              <span className="num">
                {r.preostalo >= 0
                  ? `ostaje ${km(r.preostalo, { skraceno })}`
                  : `više za ${km(-r.preostalo, { skraceno })}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
