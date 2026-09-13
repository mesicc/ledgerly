import { km, postotak } from '../lib/format.js'
import { oznaka, prethodni } from '../lib/period.js'
import { Icon } from './icons.jsx'

function Delta({ promjena, dobroKadRaste }) {
  if (promjena === null) return <span className="delta neutral">—</span>
  if (Math.abs(promjena) < 0.05) return <span className="delta neutral">0,0 %</span>
  const raste = promjena > 0
  const dobro = raste === dobroKadRaste
  return (
    <span className={`delta ${dobro ? 'good' : 'bad'}`}>
      <Icon name={raste ? 'arrow-up' : 'arrow-down'} size={11} />
      {postotak(promjena)}
    </span>
  )
}

export default function KpiCards({ podaci, zrno, sidro, skraceno }) {
  const { sada, prije, promjene, imaPrethodni } = podaci
  const prosli = oznaka(zrno, prethodni(zrno, sidro)).split(' · ')[0]

  const kartice = [
    { key: 'uplate', naslov: 'Uplate', v: sada.uplate, p: prije.uplate, d: promjene.uplate, dobro: true, boja: 'var(--income)' },
    { key: 'trosak', naslov: 'Potrošeno', v: sada.trosak, p: prije.trosak, d: promjene.trosak, dobro: false, boja: 'var(--expense)' },
    { key: 'ostaje', naslov: 'Ostaje', v: sada.ostaje, p: prije.ostaje, d: promjene.ostaje, dobro: true, boja: 'var(--ink)' },
  ]

  return (
    <div className="kpis">
      {kartice.map((k) => (
        <article key={k.key} className="card kpi" style={{ '--kpi-color': k.boja }}>
          <div className="kpi-label">
            <span>{k.naslov}</span>
            <Delta promjena={k.d} dobroKadRaste={k.dobro} />
          </div>
          <div className="kpi-value num">
            {km(k.v, { skraceno, valuta: false })}
            <span className="cur">KM</span>
          </div>
          <div className="kpi-foot">
            {imaPrethodni ? (
              <>
                <span>vs. {prosli}</span>
                <span className="num">{km(k.p, { skraceno })}</span>
              </>
            ) : (
              <span>Nema podataka za prethodni period</span>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
