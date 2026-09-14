import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { Icon } from '../components/icons.jsx'
import { createSeedEntries } from '../data/seed.js'
import { kpi, poKategorijama, serijeKrozVrijeme, uPeriodu } from '../lib/compute.js'
import { broj, km, postotak } from '../lib/format.js'
import { useTema } from '../lib/useTema.js'

const SIDRO = { godina: 2026, mjesec: 8 }

const MOGUCNOSTI = [
  { ikona: 'bars', naslov: 'Tri broja koja su bitna', tekst: 'Uplate, potrošeno i koliko ostaje, uz promjenu u odnosu na prethodni period.' },
  { ikona: 'calendar', naslov: 'Mjesec, kvartal, godina', tekst: 'Jedan klik i svi brojevi, grafikoni i limiti se preračunaju za odabrani period.' },
  { ikona: 'list', naslov: 'Na šta trošimo', tekst: 'Troškovi po kategorijama. Klik na kategoriju odmah filtrira listu stavki.' },
  { ikona: 'gauge', naslov: 'Limiti koji upozore na vrijeme', tekst: 'Žuto kad se približite limitu, crveno kad ga pređete. Prije kraja mjeseca, ne poslije.' },
  { ikona: 'file', naslov: 'Izvoz u CSV', tekst: 'Stavke perioda u formatu koji Excel otvara bez ikakvog podešavanja.' },
  { ikona: 'contrast', naslov: 'Svijetli i tamni način', tekst: 'Topla papirna tema za dan, tamna za večer. Izbor se pamti.' },
]

const KORACI = [
  { naslov: 'Napravite račun', tekst: 'Ime, e-mail i lozinka. Po želji učitajte primjer podataka da odmah vidite kako pregled izgleda.' },
  { naslov: 'Unesite stavke', tekst: 'Plate, stanarinu, režije, kupovine. Svaka stavka ima opis, iznos, datum i kategoriju.' },
  { naslov: 'Pratite i prilagodite', tekst: 'Pogledajte gdje novac odlazi i postavite realne limite za naredni mjesec.' },
]

function pripremiPregled() {
  const stavke = createSeedEntries()
  const mjesec = uPeriodu(stavke, 'month', SIDRO)
  return {
    kpi: kpi(stavke, 'month', SIDRO),
    mjeseci: serijeKrozVrijeme(uPeriodu(stavke, 'year', SIDRO), 'year', SIDRO).slice(0, 9),
    kategorije: poKategorijama(mjesec).redovi.slice(0, 4),
  }
}

function stubic(x, y, w, h, r = 3) {
  if (h <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

// Grafikon se crta u stvarnoj širini (ne skalira se preko viewBoxa), da oznake
// mjeseci ostanu čitljive i na mobitelu.
function MiniGrafikon({ mjeseci }) {
  const omotac = useRef(null)
  const [W, setW] = useState(520)

  useLayoutEffect(() => {
    const el = omotac.current
    if (!el) return
    const mjeri = (w) => w > 0 && setW(Math.round(w))
    mjeri(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([e]) => mjeri(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const H = W < 400 ? 130 : 150
  const P = { l: 2, r: 2, t: 8, b: 22 }
  const pw = W - P.l - P.r
  const ph = H - P.t - P.b
  const maks = Math.max(...mjeseci.flatMap((m) => [m.uplate, m.trosak]))
  const vrh = Math.ceil(maks / 1000) * 1000
  const y = (v) => P.t + ph - (v / vrh) * ph
  const gw = pw / mjeseci.length
  const razmak = 2
  const sw = Math.max(4, Math.min(13, (gw * 0.7 - razmak) / 2))

  return (
    <div ref={omotac}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Primjer grafikona: mjesečne uplate i troškovi od januara do septembra"
        style={{ display: 'block', maxWidth: '100%' }}
      >
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={P.l} x2={W - P.r} y1={y(vrh * t)} y2={y(vrh * t)}
            stroke={t === 0 ? 'var(--baseline)' : 'var(--grid)'}
            shapeRendering="crispEdges"
          />
        ))}
        {mjeseci.map((m, i) => {
          const x0 = P.l + gw * i + (gw - (sw * 2 + razmak)) / 2
          return (
            <g key={m.key}>
              <path d={stubic(x0, y(m.uplate), sw, y(0) - y(m.uplate))} fill="var(--income)" />
              <path d={stubic(x0 + sw + razmak, y(m.trosak), sw, y(0) - y(m.trosak))} fill="var(--expense)" />
              <text className="chart-axis-x" x={P.l + gw * i + gw / 2} y={H - 6} textAnchor="middle" style={{ fontSize: 11 }}>
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Pregled({ podaci }) {
  const { sada, promjene } = podaci.kpi
  const maks = podaci.kategorije[0]?.iznos ?? 1
  const plocice = [
    { naziv: 'Uplate', v: sada.uplate, d: promjene.uplate, dobro: true },
    { naziv: 'Potrošeno', v: sada.trosak, d: promjene.trosak, dobro: false },
    { naziv: 'Ostaje', v: sada.ostaje, d: promjene.ostaje, dobro: true },
  ]

  return (
    <div className="card preview" aria-label="Primjer dashboarda s izmišljenim podacima">
      <div className="preview-head">
        <b>Septembar 2026.</b>
        <span>Primjer podataka</span>
      </div>
      <div className="preview-kpis">
        {plocice.map((p) => {
          const dobro = (p.d > 0) === p.dobro
          return (
            <div key={p.naziv} className="preview-kpi">
              <span>{p.naziv}</span>
              <b>{km(p.v, { skraceno: true })}</b>
              <small style={{ color: dobro ? 'var(--income-text)' : 'var(--expense-text)' }}>{postotak(p.d)}</small>
            </div>
          )
        })}
      </div>
      <div className="preview-chart">
        <div className="legend" style={{ marginBottom: 6, fontSize: 11.5 }}>
          <span><i className="swatch" style={{ background: 'var(--income)' }} />Uplate</span>
          <span><i className="swatch" style={{ background: 'var(--expense)' }} />Troškovi</span>
        </div>
        <MiniGrafikon mjeseci={podaci.mjeseci} />
      </div>
      <div className="preview-cats">
        {podaci.kategorije.map((k) => (
          <div key={k.key} className="preview-cat">
            <div className="row">
              <span>{k.naziv}</span>
              <span className="num" style={{ color: 'var(--muted)' }}>{broj(k.udio, 0)} %</span>
            </div>
            <div className="cat-track">
              <div className="cat-fill" style={{ width: `${(k.iznos / maks) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const skrolaj = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function Landing() {
  const { korisnik } = useAuth()
  const [tema, promijeniTemu] = useTema()
  const pregled = useMemo(pripremiPregled, [])

  return (
    <div className="site">
      <nav className="site-nav" aria-label="Glavna navigacija">
        <a href="#/" className="logo-link">
          <span className="logo-mark" aria-hidden="true" />
          Ledgerly
        </a>
        <div className="nav-links">
          <button className="nav-link" onClick={() => skrolaj('mogucnosti')}>Mogućnosti</button>
          <button className="nav-link" onClick={() => skrolaj('kako-radi')}>Kako radi</button>
          <button className="nav-link" onClick={() => skrolaj('privatnost')}>Privatnost</button>
        </div>
        <div className="nav-actions">
          <button
            className="icon-btn"
            onClick={promijeniTemu}
            aria-label={tema === 'dark' ? 'Uključi svijetli način' : 'Uključi tamni način'}
            title={tema === 'dark' ? 'Svijetli način' : 'Tamni način'}
          >
            <Icon name={tema === 'dark' ? 'sun' : 'moon'} />
          </button>
          {korisnik ? (
            <a className="btn primary" href="#/dashboard">
              Otvori pregled <Icon name="arrow-right" size={15} />
            </a>
          ) : (
            <>
              <a className="btn ghost" href="#/prijava">Prijava</a>
              <a className="btn primary" href="#/registracija">Registruj se</a>
            </>
          )}
        </div>
      </nav>

      <header className="hero">
        <div>
          <p className="eyebrow">Kućni budžet za domaćinstva</p>
          <h1>Znajte gdje ide svaka marka.</h1>
          <p className="hero-lead">
            Ledgerly sabira plate, račune i sitne troškove na jedno mjesto. Vidite koliko je ušlo,
            koliko je potrošeno i koliko ostaje — po mjesecu, kvartalu ili godini.
          </p>
          <div className="hero-cta">
            {korisnik ? (
              <a className="btn primary lg" href="#/dashboard">
                Nastavi kao {korisnik.ime} <Icon name="arrow-right" size={16} />
              </a>
            ) : (
              <>
                <a className="btn primary lg" href="#/registracija">
                  Napravi besplatan račun <Icon name="arrow-right" size={16} />
                </a>
                <a className="btn lg" href="#/prijava">Već imam račun</a>
              </>
            )}
          </div>
          <p className="hero-fine">Besplatno. Registracija traje manje od minute.</p>
        </div>
        <Pregled podaci={pregled} />
      </header>

      <section className="section" id="mogucnosti">
        <div className="section-head">
          <p className="eyebrow">Mogućnosti</p>
          <h2>Sve što domaćinstvu treba, ništa što mu ne treba.</h2>
          <p>Bez knjigovodstvenih izraza i bez podešavanja. Unesete stavku, a pregled se sam složi.</p>
        </div>
        <div className="features">
          {MOGUCNOSTI.map((m) => (
            <article key={m.naslov} className="card feature">
              <div className="feature-icon"><Icon name={m.ikona} /></div>
              <h3>{m.naslov}</h3>
              <p>{m.tekst}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="kako-radi">
        <div className="section-head">
          <p className="eyebrow">Kako radi</p>
          <h2>Od registracije do prvog pregleda za nekoliko minuta.</h2>
        </div>
        <ol className="steps">
          {KORACI.map((k, i) => (
            <li key={k.naslov} className="step">
              <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{k.naslov}</h3>
              <p>{k.tekst}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section privacy" id="privatnost">
        <div className="section-head" style={{ marginBottom: 0 }}>
          <p className="eyebrow">Privatnost</p>
          <h2>Vaši podaci ostaju kod vas.</h2>
          <p>
            U ovoj verziji Ledgerly sve čuva lokalno, u vašem browseru: račun, stavke i podešavanja.
            Ništa se ne šalje na server.
          </p>
        </div>
        <ul className="privacy-list">
          <li>
            <Icon name="lock" />
            <div><b>Lozinka se ne čuva u čitljivom obliku</b>Sprema se samo njen hash, sa nasumičnom soli za svaki račun.</div>
          </li>
          <li>
            <Icon name="check" />
            <div><b>Svaki korisnik vidi samo svoje stavke</b>Podaci su odvojeni po računu, i na istom računaru.</div>
          </li>
          <li>
            <Icon name="file" />
            <div><b>Podaci su uvijek vaši</b>Izvezite stavke u CSV kad god želite i ponesite ih u Excel.</div>
          </li>
        </ul>
      </section>

      <section className="cta-band">
        <div>
          <h2>Počnite s ovim mjesecom.</h2>
          <p>Prvi pregled imate čim unesete platu i nekoliko računa.</p>
        </div>
        <a className="btn lg inverse" href={korisnik ? '#/dashboard' : '#/registracija'}>
          {korisnik ? 'Otvori pregled' : 'Napravi račun'} <Icon name="arrow-right" size={16} />
        </a>
      </section>

      <footer className="site-footer">
        <span>© 2026 Ledgerly · Kućni budžet domaćinstva</span>
        <span>Svi iznosi u konvertibilnim markama (KM)</span>
      </footer>
    </div>
  )
}
