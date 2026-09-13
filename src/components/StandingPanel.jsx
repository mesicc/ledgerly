import { sazetak } from '../lib/compute.js'
import { catName } from '../data/categories.js'
import { broj, datumKratko, km, mnozina } from '../lib/format.js'

export default function StandingPanel({ stavke, zrno, sidro, skraceno }) {
  const s = sazetak(stavke, zrno, sidro)
  const uplate = stavke.filter((x) => x.type === 'income').length
  const troskovi = s.brojStavki - uplate
  const ostaje = Math.max(0, Math.min(1, s.odSvakeMarke))
  const imaUplata = s.prosjecniPrihod > 0

  return (
    <>
      <div className="card-head">
        <div>
          <h2 className="card-title">Kako stojimo</h2>
          <p className="card-sub">
            {s.brojMjeseciSPodacima > 0
              ? `Prosjek na osnovu ${s.brojMjeseciSPodacima} ${mnozina(s.brojMjeseciSPodacima, 'mjeseca', 'mjeseca', 'mjeseci')}`
              : 'Nema podataka u periodu'}
          </p>
        </div>
      </div>
      <div className="card-body">
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Prosječan mjesečni prihod</div>
            <div className="stat-value num" style={{ color: 'var(--income-text)' }}>
              {km(s.prosjecniPrihod, { skraceno })}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Prosječna mjesečna potrošnja</div>
            <div className="stat-value num">{km(s.prosjecnaPotrosnja, { skraceno })}</div>
          </div>
        </div>

        <div className="marka">
          {!imaUplata ? (
            <div className="marka-line">Nema uplata u ovom periodu.</div>
          ) : s.odSvakeMarke >= 0 ? (
            <div className="marka-line">
              Od svake uplaćene marke ostaje <strong className="num">{broj(s.odSvakeMarke)} KM</strong>
            </div>
          ) : (
            <div className="marka-line">
              Na svaku uplaćenu marku trošimo <strong className="num" style={{ color: 'var(--expense-text)' }}>{broj(1 - s.odSvakeMarke)} KM</strong>
            </div>
          )}
          {imaUplata && (
            <>
              <div className="marka-bar" aria-hidden="true">
                <div style={{ flex: 1 - ostaje || 0.0001, background: 'var(--expense)' }} />
                {ostaje > 0 && <div style={{ flex: ostaje, background: 'var(--income)' }} />}
              </div>
              <div className="marka-legend num">
                <span>potrošeno {broj(Math.min(1 - s.odSvakeMarke, 9.99))}</span>
                <span>ostaje {broj(s.odSvakeMarke)}</span>
              </div>
            </>
          )}
        </div>

        <div className="biggest">
          <div className="stat-label">Najveća stavka</div>
          {s.najveca ? (
            <>
              <div className="biggest-row">
                <span className="biggest-desc" title={s.najveca.description}>{s.najveca.description}</span>
                <span className="num" style={{ fontWeight: 500 }}>{km(s.najveca.amount, { skraceno })}</span>
              </div>
              <div className="cat-tag" style={{ fontSize: 12 }}>
                <i className="dot" style={{ background: `var(--cat-${s.najveca.category})` }} />
                {catName(s.najveca.category)} · {datumKratko(s.najveca.date)}
              </div>
            </>
          ) : (
            <span className="card-sub">—</span>
          )}
        </div>

        <div className="biggest" style={{ borderTop: '1px solid var(--grid)', paddingTop: 12 }}>
          <div className="biggest-row">
            <span className="stat-label">Broj stavki</span>
            <span className="num" style={{ fontWeight: 500, fontSize: 17 }}>{s.brojStavki}</span>
          </div>
          <div className="card-sub" style={{ margin: 0 }}>
            {uplate} {mnozina(uplate, 'uplata', 'uplate', 'uplata')} · {troskovi} {mnozina(troskovi, 'trošak', 'troška', 'troškova')}
          </div>
        </div>
      </div>
    </>
  )
}
