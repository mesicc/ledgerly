import { useLayoutEffect, useRef, useState } from 'react'
import { broj, brojSkraceno, km } from '../lib/format.js'

const PREKIDAC = [
  { key: 'sve', label: 'Sve' },
  { key: 'uplate', label: 'Uplate' },
  { key: 'troskovi', label: 'Troškovi' },
]

// Boja prati seriju, ne njen redoslijed: uplate su uvijek zelene, troškovi
// uvijek terakota, bez obzira na to koja je serija trenutno vidljiva.
const SERIJE = [
  { key: 'uplate', polje: 'uplate', label: 'Uplate', boja: 'var(--income)' },
  { key: 'troskovi', polje: 'trosak', label: 'Troškovi', boja: 'var(--expense)' },
]

function lijepKorak(sirovi) {
  const e = Math.pow(10, Math.floor(Math.log10(sirovi)))
  const f = sirovi / e
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e
}

// Stubić zaobljen samo na vrhu, oslonjen na osnovnu liniju.
function stubic(x, y, w, h, r = 4) {
  if (h <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

export default function TrendChart({ serije, zrno, serija, onSerija, skraceno }) {
  const omotac = useRef(null)
  const [sirina, setSirina] = useState(720)
  const [hover, setHover] = useState(null)

  // Na uskim ekranima: niži grafikon, uža osa i skraćene vrijednosti na osi.
  const uzak = sirina < 480
  const VISINA = uzak ? 220 : 260
  const P = uzak ? { l: 42, r: 4, t: 14, b: 30 } : { l: 58, r: 8, t: 14, b: 30 }

  useLayoutEffect(() => {
    const el = omotac.current
    if (!el) return
    setSirina(Math.max(280, Math.round(el.getBoundingClientRect().width)))
    const ro = new ResizeObserver(([e]) => setSirina(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const vidljive = SERIJE.filter((s) => serija === 'sve' || s.key === serija)
  const pw = sirina - P.l - P.r
  const ph = VISINA - P.t - P.b

  const maks = Math.max(0, ...serije.flatMap((b) => vidljive.map((s) => b[s.polje])))
  const korak = maks > 0 ? lijepKorak(maks / 4) : 250
  const vrh = maks > 0 ? Math.ceil(maks / korak) * korak : 1000
  const ticks = []
  for (let v = 0; v <= vrh + korak / 1000; v += korak) ticks.push(v)
  const y = (v) => P.t + ph - (v / vrh) * ph

  const n = serije.length
  const gw = pw / n
  // Kad su kolone preuske za sve oznake (npr. 12 mjeseci na mobitelu), prikaži svaku drugu.
  const korakOznake = gw < 30 ? 2 : 1
  const k = vidljive.length
  const razmak = 2
  const maxStub = n <= 5 ? 34 : n <= 6 ? 30 : 18
  const sw = Math.max(4, Math.min(maxStub, (gw * 0.62 - razmak * (k - 1)) / k))
  const grupa = k * sw + (k - 1) * razmak

  const ukupno = {
    uplate: serije.reduce((a, b) => a + b.uplate, 0),
    trosak: serije.reduce((a, b) => a + b.trosak, 0),
  }
  const prazno = serije.every((b) => b.uplate === 0 && b.trosak === 0)
  const osa = (v) => (skraceno || uzak ? brojSkraceno(v) : broj(v, 0))

  const h = hover != null ? serije[hover] : null
  const tipX = hover != null ? Math.min(Math.max(P.l + gw * hover + gw / 2, 100), sirina - 100) : 0
  const tipY = h ? Math.max(y(Math.max(...vidljive.map((s) => h[s.polje]))), 70) : 0

  return (
    <>
      <div className="card-head">
        <div>
          <h2 className="card-title">Kretanje kroz vrijeme</h2>
          <p className="card-sub">{zrno === 'month' ? 'Po sedmicama u mjesecu' : 'Po mjesecima'}</p>
        </div>
        <div className="seg small" role="group" aria-label="Prikaz serija">
          {PREKIDAC.map((s) => (
            <button key={s.key} aria-pressed={serija === s.key} onClick={() => onSerija(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card-body">
        <div className="legend" style={{ marginBottom: 10 }}>
          {vidljive.map((s) => (
            <span key={s.key}>
              <i className="swatch" style={{ background: s.boja }} />
              {s.label}
              <b className="num" style={{ fontWeight: 500, color: 'var(--ink)' }}>
                {km(ukupno[s.polje], { skraceno })}
              </b>
            </span>
          ))}
        </div>

        <div className="chart-wrap" ref={omotac}>
          <svg
            width={sirina}
            height={VISINA}
            viewBox={`0 0 ${sirina} ${VISINA}`}
            role="img"
            aria-label={`Grafikon uplata i troškova, ${serije.length} ${zrno === 'month' ? 'sedmica' : 'mjeseci'}`}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={P.l} x2={sirina - P.r} y1={y(t)} y2={y(t)}
                  stroke={t === 0 ? 'var(--baseline)' : 'var(--grid)'}
                  strokeWidth="1"
                  shapeRendering="crispEdges"
                />
                <text className="chart-axis" x={P.l - 10} y={y(t)} dy="0.35em" textAnchor="end">
                  {osa(t)}
                </text>
              </g>
            ))}

            {serije.map((b, i) => {
              const gx = P.l + gw * i
              const x0 = gx + (gw - grupa) / 2
              return (
                <g key={b.key} className={`bar-group${hover != null && hover !== i ? ' dim' : ''}`}>
                  {vidljive.map((s, j) => {
                    const v = b[s.polje]
                    const top = y(v)
                    return (
                      <path
                        key={s.key}
                        className="bar"
                        d={stubic(x0 + j * (sw + razmak), top, sw, y(0) - top)}
                        fill={s.boja}
                      />
                    )
                  })}
                  {i % korakOznake === 0 && (
                    <text className="chart-axis-x" x={gx + gw / 2} y={VISINA - 8} textAnchor="middle">
                      {b.label}
                    </text>
                  )}
                  <rect
                    x={gx} y={P.t} width={gw} height={ph + P.b}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${b.opis}: uplate ${km(b.uplate)}, troškovi ${km(b.trosak)}`}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    style={{ outline: 'none' }}
                  />
                </g>
              )
            })}

            {prazno && (
              <text x={P.l + pw / 2} y={P.t + ph / 2} textAnchor="middle" className="chart-axis-x" style={{ fill: 'var(--muted)' }}>
                Nema stavki u ovom periodu
              </text>
            )}
          </svg>

          {h && !prazno && (
            <div className="tooltip" style={{ left: tipX, top: tipY }}>
              <div className="tooltip-title">{h.opis}</div>
              <div className="tooltip-row">
                <span><i className="swatch" style={{ background: 'var(--income)', marginRight: 6 }} />Uplate</span>
                <strong className="num">{km(h.uplate)}</strong>
              </div>
              <div className="tooltip-row">
                <span><i className="swatch" style={{ background: 'var(--expense)', marginRight: 6 }} />Troškovi</span>
                <strong className="num">{km(h.trosak)}</strong>
              </div>
              <div className="tooltip-sep" />
              <div className="tooltip-row">
                <span>Razlika</span>
                <strong className="num">{km(h.uplate - h.trosak, { predznak: true })}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
