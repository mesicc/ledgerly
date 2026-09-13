import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, catName } from '../data/categories.js'
import { sume } from '../lib/compute.js'
import { broj, datum, km, mnozina } from '../lib/format.js'
import { Icon } from './icons.jsx'

const KORAK = 15

export default function EntriesTable({ stavke, kljucPerioda, oznakaPerioda, filter, onFilter, onUredi, onObrisi }) {
  const [limit, setLimit] = useState(KORAK)
  useEffect(() => setLimit(KORAK), [kljucPerioda, filter])

  const brojPoKategoriji = useMemo(() => {
    const m = new Map()
    for (const s of stavke) m.set(s.category, (m.get(s.category) ?? 0) + 1)
    return m
  }, [stavke])

  const chipovi = CATEGORIES.filter((c) => brojPoKategoriji.has(c.key) || c.key === filter)

  const filtrirane = useMemo(
    () =>
      stavke
        .filter((s) => !filter || s.category === filter)
        .sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1)),
    [stavke, filter]
  )
  const prikazane = filtrirane.slice(0, limit)
  const zbir = sume(filtrirane)

  return (
    <>
      <div className="card-head">
        <div>
          <h2 className="card-title">Stavke</h2>
          <p className="card-sub">
            {filtrirane.length} {mnozina(filtrirane.length, 'stavka', 'stavke', 'stavki')} · {oznakaPerioda}
            {filter && ` · ${catName(filter)}`}
          </p>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Filter po kategoriji">
        <button className="chip" aria-pressed={!filter} onClick={() => onFilter(null)}>
          Sve <span className="count">{stavke.length}</span>
        </button>
        {chipovi.map((c) => (
          <button
            key={c.key}
            className="chip"
            aria-pressed={filter === c.key}
            onClick={() => onFilter(filter === c.key ? null : c.key)}
          >
            <i className="dot" style={{ background: `var(--cat-${c.key})` }} />
            {c.name}
            <span className="count">{brojPoKategoriji.get(c.key) ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="table-scroll">
        {filtrirane.length === 0 ? (
          <div className="empty">Nema stavki za odabrani period i filter.</div>
        ) : (
          <table className="entries">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Datum</th>
                <th>Opis</th>
                <th>Kategorija</th>
                <th className="r">Iznos (KM)</th>
                <th className="r" style={{ width: 80 }}><span className="sr-only">Akcije</span></th>
              </tr>
            </thead>
            <tbody>
              {prikazane.map((s) => (
                <tr key={s.id}>
                  <td className="date num">{datum(s.date)}</td>
                  <td className="desc">{s.description}</td>
                  <td>
                    <span className="cat-tag">
                      <i className="dot" style={{ background: `var(--cat-${s.category})` }} />
                      {catName(s.category)}
                    </span>
                  </td>
                  <td className={`r amount num ${s.type === 'income' ? 'in' : 'out'}`}>
                    {s.type === 'income' ? '+' : '−'}
                    {broj(s.amount)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn sm" onClick={() => onUredi(s)} aria-label={`Uredi: ${s.description}`} title="Uredi">
                        <Icon name="pencil" size={15} />
                      </button>
                      <button className="icon-btn sm" onClick={() => onObrisi(s)} aria-label={`Obriši: ${s.description}`} title="Obriši">
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="table-foot">
        <span className="card-sub" style={{ margin: 0 }}>
          {filtrirane.length > 0 && `Prikazano ${prikazane.length} od ${filtrirane.length}`}
          {filtrirane.length > limit && (
            <>
              {' · '}
              <button className="link-btn" onClick={() => setLimit(filtrirane.length)}>Prikaži sve</button>
            </>
          )}
          {limit > KORAK && filtrirane.length > KORAK && (
            <>
              {' · '}
              <button className="link-btn" onClick={() => setLimit(KORAK)}>Prikaži manje</button>
            </>
          )}
        </span>
        <div className="net num">
          <span>Uplate <strong className="pos">{km(zbir.uplate, { predznak: zbir.uplate > 0 })}</strong></span>
          <span>Troškovi <strong>{km(-zbir.trosak)}</strong></span>
          <span>
            Neto{' '}
            <strong className={zbir.ostaje >= 0 ? 'pos' : 'neg'}>{km(zbir.ostaje, { predznak: true })}</strong>
          </span>
        </div>
      </div>
    </>
  )
}
