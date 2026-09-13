import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES } from './data/categories.js'
import { createSeedEntries } from './data/seed.js'
import { kpi, serijeKrozVrijeme, uPeriodu } from './lib/compute.js'
import { napraviCSV, preuzmi } from './lib/csv.js'
import { mnozina } from './lib/format.js'
import {
  dozvoljen, izIndeksa, mjesecniIndeks, oznaka, oznakaKratka, pomjeri, raspon,
} from './lib/period.js'
import { sacuvaj, sacuvajTekst, ucitaj } from './lib/storage.js'
import Header from './components/Header.jsx'
import KpiCards from './components/KpiCards.jsx'
import TrendChart from './components/TrendChart.jsx'
import CategoryPanel from './components/CategoryPanel.jsx'
import EntriesTable from './components/EntriesTable.jsx'
import LimitsPanel from './components/LimitsPanel.jsx'
import StandingPanel from './components/StandingPanel.jsx'
import EntryModal from './components/EntryModal.jsx'

const KLJUC = {
  stavke: 'ledgerly.entries.v1',
  tema: 'ledgerly.theme',
  tweaks: 'ledgerly.tweaks.v1',
}

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

export default function App() {
  const [stavke, setStavke] = useState(() => {
    const spremljeno = ucitaj(KLJUC.stavke, null)
    return ispravneStavke(spremljeno) ? spremljeno : createSeedEntries()
  })
  useEffect(() => sacuvaj(KLJUC.stavke, stavke), [stavke])

  const [tema, setTema] = useState(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  )
  useEffect(() => {
    document.documentElement.dataset.theme = tema
    sacuvajTekst(KLJUC.tema, tema)
  }, [tema])

  const [tweaks, setTweaks] = useState(() => ({ ...ZADANI_TWEAKS, ...ucitaj(KLJUC.tweaks, {}) }))
  useEffect(() => sacuvaj(KLJUC.tweaks, tweaks), [tweaks])

  const granice = useMemo(() => granicePodataka(stavke), [stavke])
  const [zrno, setZrno] = useState(tweaks.pocetniPeriod)
  // Otvara se na posljednjem mjesecu s podacima, ali ne poslije današnjeg.
  const [sidro, setSidro] = useState(() =>
    izIndeksa(Math.min(granice.max, Math.max(granice.min, mjesecniIndeks(danas()))))
  )
  const [filter, setFilter] = useState(null)
  const [serija, setSerija] = useState('sve')
  const [modal, setModal] = useState(null) // null | { stavka: objekat | null }
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

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

  const vratiPocetne = () => {
    if (!window.confirm('Vratiti početne podatke? Sve dodane i izmijenjene stavke bit će izgubljene.')) return
    setStavke(createSeedEntries())
    setFilter(null)
    obavijesti('Početni podaci su vraćeni.')
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
        onTema={() => setTema((t) => (t === 'dark' ? 'light' : 'dark'))}
        onIzvoz={izvezi}
        onDodaj={() => setModal({ stavka: null })}
        tweaks={tweaks}
        onTweaks={setTweaks}
        onReset={vratiPocetne}
      />

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
