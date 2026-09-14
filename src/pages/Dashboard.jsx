import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { CATEGORIES } from '../data/categories.js'
import { createSeedEntries } from '../data/seed.js'
import { kpi, serijeKrozVrijeme, uPeriodu } from '../lib/compute.js'
import { napraviCSV, preuzmi } from '../lib/csv.js'
import { mnozina } from '../lib/format.js'
import {
  dozvoljen, izIndeksa, mjesecniIndeks, oznaka, oznakaKratka, pomjeri, raspon,
} from '../lib/period.js'
import { idi } from '../lib/router.js'
import { sacuvaj, ucitaj } from '../lib/storage.js'
import { useTema } from '../lib/useTema.js'
import { useAuth } from '../auth/AuthContext.jsx'
import Header from '../components/Header.jsx'
import KpiCards from '../components/KpiCards.jsx'
import TrendChart from '../components/TrendChart.jsx'
import CategoryPanel from '../components/CategoryPanel.jsx'
import EntriesTable from '../components/EntriesTable.jsx'
import LimitsPanel from '../components/LimitsPanel.jsx'
import StandingPanel from '../components/StandingPanel.jsx'
import EntryModal from '../components/EntryModal.jsx'

// Stavke i podešavanja čuvaju se odvojeno za svakog korisnika.
const kljucevi = (email) => ({
  stavke: `ledgerly.entries.v1:${email}`,
  tweaks: `ledgerly.tweaks.v1:${email}`,
})

const ZADANI_TWEAKS = { pocetniPeriod: 'month', prikaziLimite: true, skraceno: false }

// Boje kategorija kao CSS varijable, po jedna vrijednost za svaku temu.
const CAT_CSS =
  `:root{${CATEGORIES.map((c) => `--cat-${c.key}:${c.light};`).join('')}}` +
  `:root[data-theme='dark']{${CATEGORIES.map((c) => `--cat-${c.key}:${c.dark};`).join('')}}`

const danas = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ispravneStavke(v) {
  return (
    Array.isArray(v) &&
    v.every((s) => s && typeof s.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && Number.isFinite(s.amount))
  )
}

function granicePodataka(stavke) {
  let min = Infinity
  let max = -Infinity
  for (const s of stavke) {
    const i = mjesecniIndeks(s.date)
    if (i < min) min = i
    if (i > max) max = i
  }
  if (!Number.isFinite(min)) {
    const i = mjesecniIndeks(danas())
    return { min: i, max: i }
  }
  return { min, max }
}

// Posljednji mjesec s podacima, ali ne poslije današnjeg.
const pocetnoSidro = (granice) =>
  izIndeksa(Math.min(granice.max, Math.max(granice.min, mjesecniIndeks(danas()))))

export default function Dashboard() {
  const { korisnik, odjava } = useAuth()
  const K = kljucevi(korisnik.email)

  const [stavke, setStavke] = useState(() => {
    const spremljeno = ucitaj(K.stavke, null)
    if (ispravneStavke(spremljeno)) return spremljeno
    return korisnik.primjer ? createSeedEntries() : []
  })
  useEffect(() => sacuvaj(K.stavke, stavke), [K.stavke, stavke])

  const [tema, promijeniTemu] = useTema()

  const [tweaks, setTweaks] = useState(() => ({ ...ZADANI_TWEAKS, ...ucitaj(K.tweaks, {}) }))
  useEffect(() => sacuvaj(K.tweaks, tweaks), [K.tweaks, tweaks])

  const granice = useMemo(() => granicePodataka(stavke), [stavke])
  const [zrno, setZrno] = useState(tweaks.pocetniPeriod)
  const [sidro, setSidro] = useState(() => pocetnoSidro(granice))
  const [filter, setFilter] = useState(null)
  const [serija, setSerija] = useState('sve')
  const [modal, setModal] = useState(null) // null | { stavka: objekat | null }
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const obavijesti = useCallback((tekst, akcija) => {
    clearTimeout(toastTimer.current)
    setToast({ tekst, akcija })
    toastTimer.current = setTimeout(() => setToast(null), 5000)
  }, [])

  const periodStavke = useMemo(() => uPeriodu(stavke, zrno, sidro), [stavke, zrno, sidro])
  const kpiPodaci = useMemo(() => kpi(stavke, zrno, sidro), [stavke, zrno, sidro])
  const serije = useMemo(() => serijeKrozVrijeme(periodStavke, zrno, sidro), [periodStavke, zrno, sidro])
  const oznakaPerioda = oznaka(zrno, sidro)
  const kljucPerioda = `${zrno}:${raspon(zrno, sidro).od}`

  const mozeNazad = dozvoljen(zrno, pomjeri(zrno, sidro, -1), granice)
  const mozeNaprijed = dozvoljen(zrno, pomjeri(zrno, sidro, 1), granice)

  const zadaniDatum = useMemo(() => {
    const r = raspon(zrno, sidro)
    const d = danas()
    return d >= r.od && d <= r.do ? d : r.do < d ? r.do : r.od
  }, [zrno, sidro])

  const spremi = (podaci) => {
    const nova = !podaci.id
    const stavka = nova ? { ...podaci, id: `n${Date.now().toString(36)}` } : podaci
    setStavke((prev) => (nova ? [stavka, ...prev] : prev.map((s) => (s.id === stavka.id ? stavka : s))))
    setModal(null)

    const r = raspon(zrno, sidro)
    if (stavka.date < r.od || stavka.date > r.do) {
      const cilj = izIndeksa(mjesecniIndeks(stavka.date))
      obavijesti(`Stavka je spremljena za ${oznaka('month', cilj)}`, {
        label: 'Prikaži',
        fn: () => setSidro(cilj),
      })
    } else {
      obavijesti(nova ? 'Stavka je dodana.' : 'Izmjene su spremljene.')
    }
  }

  const obrisi = (stavka) => {
    setStavke((prev) => prev.filter((s) => s.id !== stavka.id))
    setModal(null)
    obavijesti(`Obrisano: ${stavka.description}`, {
      label: 'Poništi',
      fn: () => setStavke((prev) => (prev.some((s) => s.id === stavka.id) ? prev : [stavka, ...prev])),
    })
  }

  const izvezi = () => {
    const redovi = periodStavke
      .filter((s) => !filter || s.category === filter)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    if (redovi.length === 0) {
      obavijesti('Nema stavki za izvoz u ovom periodu.')
      return
    }
    const ime = `ledgerly-${oznakaKratka(zrno, sidro)}${filter ? `-${filter}` : ''}.csv`
    preuzmi(napraviCSV(redovi), ime)
    obavijesti(`Izvezeno ${redovi.length} ${mnozina(redovi.length, 'stavka', 'stavke', 'stavki')} u ${ime}`)
  }

  const ucitajPrimjer = () => {
    if (
      stavke.length > 0 &&
      !window.confirm('Učitati primjer podataka? Sve vaše dodane i izmijenjene stavke bit će zamijenjene.')
    ) return
    const primjer = createSeedEntries()
    setStavke(primjer)
    setSidro(pocetnoSidro(granicePodataka(primjer)))
    setFilter(null)
    obavijesti('Primjer podataka je učitan.')
  }

  const odjaviSe = () => {
    idi('/')
    odjava()
  }

  const zatvoriModal = useCallback(() => setModal(null), [])

  return (
    <div className="app">
      <style>{CAT_CSS}</style>

      <Header
        zrno={zrno}
        onZrno={setZrno}
        sidro={sidro}
        onPomak={(smjer) => setSidro((s) => pomjeri(zrno, s, smjer))}
        mozeNazad={mozeNazad}
        mozeNaprijed={mozeNaprijed}
        tema={tema}
        onTema={promijeniTemu}
        onIzvoz={izvezi}
        onDodaj={() => setModal({ stavka: null })}
        tweaks={tweaks}
        onTweaks={setTweaks}
        onReset={ucitajPrimjer}
        korisnik={korisnik}
        onOdjava={odjaviSe}
      />

      {stavke.length === 0 && (
        <section className="card welcome">
          <div>
            <h2>Dobro došli, {korisnik.ime}.</h2>
            <p>
              Vaš dashboard je još prazan. Dodajte prvu uplatu ili trošak, ili učitajte primjer
              podataka da vidite kako sve izgleda kad se brojke skupe.
            </p>
          </div>
          <div className="welcome-actions">
            <button className="btn" onClick={ucitajPrimjer}>Učitaj primjer podataka</button>
            <button className="btn primary" onClick={() => setModal({ stavka: null })}>Dodaj prvu stavku</button>
          </div>
        </section>
      )}

      <main className="grid">
        <section className="span-12" aria-label="Sažetak perioda">
          <KpiCards podaci={kpiPodaci} zrno={zrno} sidro={sidro} skraceno={tweaks.skraceno} />
        </section>

        <section className="card span-8">
          <TrendChart serije={serije} zrno={zrno} serija={serija} onSerija={setSerija} skraceno={tweaks.skraceno} />
        </section>

        <section className="card span-4">
          <CategoryPanel stavke={periodStavke} filter={filter} onFilter={setFilter} skraceno={tweaks.skraceno} />
        </section>

        <section className="card span-8" style={{ alignSelf: 'start' }}>
          <EntriesTable
            stavke={periodStavke}
            kljucPerioda={kljucPerioda}
            oznakaPerioda={oznakaPerioda}
            filter={filter}
            onFilter={setFilter}
            onUredi={(s) => setModal({ stavka: s })}
            onObrisi={obrisi}
          />
        </section>

        <div className="stack span-4">
          {tweaks.prikaziLimite && (
            <section className="card">
              <LimitsPanel stavke={periodStavke} zrno={zrno} skraceno={tweaks.skraceno} />
            </section>
          )}
          <section className="card">
            <StandingPanel stavke={periodStavke} zrno={zrno} sidro={sidro} skraceno={tweaks.skraceno} />
          </section>
        </div>
      </main>

      {modal && (
        <EntryModal
          pocetna={modal.stavka}
          zadaniDatum={zadaniDatum}
          onSpremi={spremi}
          onObrisi={obrisi}
          onZatvori={zatvoriModal}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <span>{toast.tekst}</span>
          {toast.akcija && (
            <button
              onClick={() => {
                toast.akcija.fn()
                setToast(null)
              }}
            >
              {toast.akcija.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
