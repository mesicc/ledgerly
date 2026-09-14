import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { Icon } from '../components/icons.jsx'
import { idi } from '../lib/router.js'
import { useTema } from '../lib/useTema.js'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN_LOZINKA = 8

const PRAZNO = { ime: '', email: '', lozinka: '', potvrda: '', primjer: true, zapamti: true }

function Polje({ id, label, greska, hint, children }) {
  return (
    <div className={`field${greska ? ' invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {greska ? (
        <span className="field-err" id={`${id}-err`}>{greska}</span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </div>
  )
}

export default function AuthPage({ mod }) {
  const { prijava, registracija } = useAuth()
  const [tema, promijeniTemu] = useTema()
  const jeRegistracija = mod === 'registracija'

  const [f, setF] = useState(PRAZNO)
  const [greske, setGreske] = useState({})
  const [greskaForme, setGreskaForme] = useState(null)
  const [salje, setSalje] = useState(false)
  const [vidiLozinku, setVidiLozinku] = useState(false)
  const prvo = useRef(null)

  // Prelazak između prijave i registracije zadržava e-mail, ali briše greške.
  useEffect(() => {
    setGreske({})
    setGreskaForme(null)
    setF((p) => ({ ...PRAZNO, email: p.email }))
    prvo.current?.focus()
  }, [mod])

  const postavi = (kljuc) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setF((p) => ({ ...p, [kljuc]: v }))
    if (greske[kljuc]) setGreske((g) => ({ ...g, [kljuc]: null }))
  }

  function validiraj() {
    const g = {}
    if (jeRegistracija && !f.ime.trim()) g.ime = 'Upišite ime.'
    if (!EMAIL.test(f.email.trim())) g.email = 'Upišite ispravnu e-mail adresu.'
    if (jeRegistracija) {
      if (f.lozinka.length < MIN_LOZINKA) g.lozinka = `Lozinka mora imati najmanje ${MIN_LOZINKA} znakova.`
      if (!g.lozinka && f.potvrda !== f.lozinka) g.potvrda = 'Lozinke se ne podudaraju.'
    } else if (!f.lozinka) {
      g.lozinka = 'Upišite lozinku.'
    }
    return g
  }

  async function posalji(e) {
    e.preventDefault()
    const g = validiraj()
    setGreske(g)
    setGreskaForme(null)
    const prva = Object.keys(g).find((k) => g[k])
    if (prva) {
      document.getElementById(`a-${prva}`)?.focus()
      return
    }
    setSalje(true)
    try {
      if (jeRegistracija) {
        await registracija({ ime: f.ime, email: f.email, lozinka: f.lozinka, primjer: f.primjer })
      } else {
        await prijava({ email: f.email, lozinka: f.lozinka, zapamti: f.zapamti })
      }
      idi('/dashboard', { zamijeni: true })
    } catch (err) {
      if (err.polje) setGreske({ [err.polje]: err.message })
      else setGreskaForme(err.message || 'Nešto nije u redu. Pokušajte ponovo.')
      setSalje(false)
    }
  }

  const aria = (k) => (greske[k] ? { 'aria-invalid': true, 'aria-describedby': `a-${k}-err` } : {})

  return (
    <div className="auth">
      <header className="auth-top">
        <a href="#/" className="logo-link">
          <span className="logo-mark" aria-hidden="true" />
          Ledgerly
        </a>
        <button
          className="icon-btn"
          onClick={promijeniTemu}
          aria-label={tema === 'dark' ? 'Uključi svijetli način' : 'Uključi tamni način'}
        >
          <Icon name={tema === 'dark' ? 'sun' : 'moon'} />
        </button>
      </header>

      <div className="auth-layout">
        <aside className="auth-aside">
          <p className="eyebrow">{jeRegistracija ? 'Novi račun' : 'Prijava'}</p>
          <h2>{jeRegistracija ? 'Počnite pratiti novac svog domaćinstva.' : 'Dobro došli nazad.'}</h2>
          <ul className="auth-points">
            <li><Icon name="check" size={17} />Uplate, potrošeno i koliko ostaje na jednom ekranu</li>
            <li><Icon name="check" size={17} />Troškovi po kategorijama i limiti koji upozore na vrijeme</li>
            <li><Icon name="check" size={17} />Mjesečni, kvartalni i godišnji pregled</li>
          </ul>
          <p className="auth-note">
            <Icon name="lock" size={15} />
            Račun i stavke čuvaju se samo u ovom browseru.
          </p>
        </aside>

        <main className="card auth-card">
          <nav className="tabs" aria-label="Prijava ili registracija">
            <a href="#/prijava" aria-current={!jeRegistracija ? 'page' : undefined}>Prijava</a>
            <a href="#/registracija" aria-current={jeRegistracija ? 'page' : undefined}>Registracija</a>
          </nav>

          <h1>{jeRegistracija ? 'Napravite račun' : 'Prijavite se'}</h1>
          <p className="card-sub">
            {jeRegistracija
              ? 'Nakon registracije odmah otvarate svoj pregled.'
              : 'Unesite podatke s kojima ste se registrovali.'}
          </p>

          {greskaForme && <div className="form-alert" role="alert">{greskaForme}</div>}

          <form className="auth-form" onSubmit={posalji} noValidate>
            {jeRegistracija && (
              <Polje id="a-ime" label="Ime" greska={greske.ime}>
                <input
                  id="a-ime"
                  ref={prvo}
                  autoComplete="given-name"
                  value={f.ime}
                  onChange={postavi('ime')}
                  placeholder="npr. Amila"
                  maxLength={40}
                  {...aria('ime')}
                />
              </Polje>
            )}

            <Polje id="a-email" label="E-mail adresa" greska={greske.email}>
              <input
                id="a-email"
                ref={jeRegistracija ? undefined : prvo}
                type="email"
                autoComplete="email"
                inputMode="email"
                value={f.email}
                onChange={postavi('email')}
                placeholder="ime@primjer.ba"
                {...aria('email')}
              />
            </Polje>

            <Polje
              id="a-lozinka"
              label="Lozinka"
              greska={greske.lozinka}
              hint={jeRegistracija ? `Najmanje ${MIN_LOZINKA} znakova.` : null}
            >
              <div className="pw">
                <input
                  id="a-lozinka"
                  type={vidiLozinku ? 'text' : 'password'}
                  autoComplete={jeRegistracija ? 'new-password' : 'current-password'}
                  value={f.lozinka}
                  onChange={postavi('lozinka')}
                  {...aria('lozinka')}
                />
                <button
                  type="button"
                  className="icon-btn sm"
                  onClick={() => setVidiLozinku((v) => !v)}
                  aria-label={vidiLozinku ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                  aria-pressed={vidiLozinku}
                >
                  <Icon name={vidiLozinku ? 'eye-off' : 'eye'} size={16} />
                </button>
              </div>
            </Polje>

            {jeRegistracija && (
              <Polje id="a-potvrda" label="Ponovite lozinku" greska={greske.potvrda}>
                <input
                  id="a-potvrda"
                  type={vidiLozinku ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={f.potvrda}
                  onChange={postavi('potvrda')}
                  {...aria('potvrda')}
                />
              </Polje>
            )}

            {jeRegistracija ? (
              <label className="checkbox">
                <input type="checkbox" checked={f.primjer} onChange={postavi('primjer')} />
                <span>
                  Učitaj primjer podataka
                  <small>Izmišljeno domaćinstvo, januar–septembar 2026. Možete ga zamijeniti svojim stavkama.</small>
                </span>
              </label>
            ) : (
              <label className="checkbox">
                <input type="checkbox" checked={f.zapamti} onChange={postavi('zapamti')} />
                <span>Zapamti me na ovom računaru</span>
              </label>
            )}

            <button type="submit" className="btn primary block" disabled={salje}>
              {salje
                ? jeRegistracija ? 'Pravim račun…' : 'Prijavljujem…'
                : jeRegistracija ? 'Napravi račun' : 'Prijavi se'}
            </button>
          </form>

          <p className="auth-switch">
            {jeRegistracija ? (
              <>Već imate račun? <a href="#/prijava">Prijavite se</a></>
            ) : (
              <>Nemate račun? <a href="#/registracija">Registrujte se</a></>
            )}
          </p>
        </main>
      </div>
    </div>
  )
}
