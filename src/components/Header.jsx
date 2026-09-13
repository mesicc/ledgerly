import { useEffect, useRef, useState } from 'react'
import { ZRNA, oznaka } from '../lib/period.js'
import { Icon } from './icons.jsx'

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    />
  )
}

function TweaksMenu({ tweaks, onTweaks, onReset }) {
  const [otvoren, setOtvoren] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!otvoren) return
    const klik = (e) => ref.current && !ref.current.contains(e.target) && setOtvoren(false)
    const tipka = (e) => e.key === 'Escape' && setOtvoren(false)
    document.addEventListener('mousedown', klik)
    document.addEventListener('keydown', tipka)
    return () => {
      document.removeEventListener('mousedown', klik)
      document.removeEventListener('keydown', tipka)
    }
  }, [otvoren])

  const postavi = (kljuc) => (v) => onTweaks({ ...tweaks, [kljuc]: v })

  return (
    <div className="popover-anchor" ref={ref}>
      <button
        className="icon-btn"
        onClick={() => setOtvoren((o) => !o)}
        aria-expanded={otvoren}
        aria-label="Podešavanja prikaza"
        title="Podešavanja prikaza"
      >
        <Icon name="sliders" />
      </button>
      {otvoren && (
        <div className="popover" role="dialog" aria-label="Podešavanja prikaza">
          <h3>Podešavanja</h3>
          <div className="tweak" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <span>Početni period</span>
            <div className="seg small" role="group" aria-label="Početni period">
              {ZRNA.map((z) => (
                <button
                  key={z.key}
                  aria-pressed={tweaks.pocetniPeriod === z.key}
                  onClick={() => postavi('pocetniPeriod')(z.key)}
                  style={{ flex: 1 }}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>
          <div className="tweak">
            <span>Prikaži panel limita</span>
            <Switch checked={tweaks.prikaziLimite} onChange={postavi('prikaziLimite')} label="Prikaži panel limita" />
          </div>
          <div className="tweak">
            <span>Skraćeni brojevi (k)</span>
            <Switch checked={tweaks.skraceno} onChange={postavi('skraceno')} label="Skraćeni brojevi" />
          </div>
          <div className="popover-foot">
            <button
              className="link-btn"
              onClick={() => {
                setOtvoren(false)
                onReset()
              }}
            >
              Vrati početne podatke
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Header({
  zrno, onZrno, sidro, onPomak, mozeNazad, mozeNaprijed,
  tema, onTema, onIzvoz, onDodaj, tweaks, onTweaks, onReset,
}) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-row">
          <h1 className="logo">
            <span className="logo-mark" aria-hidden="true" />
            Ledgerly
          </h1>
          <span className="tagline">Kućni budžet domaćinstva</span>
        </div>
        <div className="period-nav">
          <button className="icon-btn sm" onClick={() => onPomak(-1)} disabled={!mozeNazad} aria-label="Prethodni period">
            <Icon name="chevron-left" />
          </button>
          <span className="period-label" aria-live="polite">{oznaka(zrno, sidro)}</span>
          <button className="icon-btn sm" onClick={() => onPomak(1)} disabled={!mozeNaprijed} aria-label="Sljedeći period">
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="seg" role="group" aria-label="Period">
          {ZRNA.map((z) => (
            <button key={z.key} aria-pressed={zrno === z.key} onClick={() => onZrno(z.key)}>
              {z.label}
            </button>
          ))}
        </div>
        <button
          className="icon-btn"
          onClick={onTema}
          aria-label={tema === 'dark' ? 'Uključi svijetli način' : 'Uključi tamni način'}
          title={tema === 'dark' ? 'Svijetli način' : 'Tamni način'}
        >
          <Icon name={tema === 'dark' ? 'sun' : 'moon'} />
        </button>
        <TweaksMenu tweaks={tweaks} onTweaks={onTweaks} onReset={onReset} />
        <button className="btn" onClick={onIzvoz}>
          <Icon name="download" />
          Izvoz CSV
        </button>
        <button className="btn primary" onClick={onDodaj}>
          <Icon name="plus" />
          Dodaj stavku
        </button>
      </div>
    </header>
  )
}
