import { useEffect, useRef, useState } from 'react'
import { CAT_BY_KEY, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/categories.js'
import { broj } from '../lib/format.js'
import { Icon } from './icons.jsx'

/** Prihvata "1.234,56", "1234,56", "1234.56" i "1 234,56". */
function parsirajIznos(tekst) {
  let t = String(tekst).replace(/\s|KM/gi, '')
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '')
  const n = Number(t)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

export default function EntryModal({ pocetna, zadaniDatum, onSpremi, onObrisi, onZatvori }) {
  const uredjivanje = Boolean(pocetna)
  const [tip, setTip] = useState(pocetna?.type ?? 'expense')
  const [opis, setOpis] = useState(pocetna?.description ?? '')
  const [iznos, setIznos] = useState(pocetna ? broj(pocetna.amount) : '')
  const [datum, setDatum] = useState(pocetna?.date ?? zadaniDatum)
  const [kategorija, setKategorija] = useState(pocetna?.category ?? 'namirnice')
  const [pokusano, setPokusano] = useState(false)
  const prvo = useRef(null)

  useEffect(() => {
    prvo.current?.focus()
    const tipka = (e) => e.key === 'Escape' && onZatvori()
    document.addEventListener('keydown', tipka)
    return () => document.removeEventListener('keydown', tipka)
  }, [onZatvori])

  const promijeniTip = (t) => {
    setTip(t)
    if (CAT_BY_KEY[kategorija]?.type !== t) setKategorija(t === 'income' ? 'plata' : 'namirnice')
  }

  const vrijednost = parsirajIznos(iznos)
  const greske = {
    opis: opis.trim() ? null : 'Upiši kratak opis.',
    iznos: vrijednost > 0 ? null : 'Iznos mora biti veći od nule.',
    datum: /^\d{4}-\d{2}-\d{2}$/.test(datum) ? null : 'Odaberi datum.',
  }
  const validno = !greske.opis && !greske.iznos && !greske.datum

  const posalji = (e) => {
    e.preventDefault()
    setPokusano(true)
    if (!validno) return
    onSpremi({
      ...(pocetna ?? {}),
      description: opis.trim(),
      amount: vrijednost,
      date: datum,
      category: kategorija,
      type: tip,
    })
  }

  const kategorije = tip === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const pokazi = (k) => pokusano && greske[k]

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onZatvori()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-naslov">
        <div className="modal-head">
          <h2 id="modal-naslov">{uredjivanje ? 'Uredi stavku' : 'Nova stavka'}</h2>
          <button className="icon-btn sm" onClick={onZatvori} aria-label="Zatvori">
            <Icon name="x" />
          </button>
        </div>
        <form onSubmit={posalji} noValidate>
          <div className="field">
            <span className="lbl">Tip</span>
            <div className="type-toggle" role="group" aria-label="Tip stavke">
              <button type="button" className="in" aria-pressed={tip === 'income'} onClick={() => promijeniTip('income')}>
                <i className="swatch" style={{ background: 'var(--income)' }} /> Uplata
              </button>
              <button type="button" className="out" aria-pressed={tip === 'expense'} onClick={() => promijeniTip('expense')}>
                <i className="swatch" style={{ background: 'var(--expense)' }} /> Trošak
              </button>
            </div>
          </div>

          <div className={`field${pokazi('opis') ? ' invalid' : ''}`}>
            <label htmlFor="f-opis">Opis</label>
            <input
              id="f-opis"
              ref={prvo}
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              placeholder={tip === 'income' ? 'npr. Honorar — prevod' : 'npr. Bingo — sedmična kupovina'}
              maxLength={80}
            />
            {pokazi('opis') && <span className="field-err">{greske.opis}</span>}
          </div>

          <div className="field-row">
            <div className={`field${pokazi('iznos') ? ' invalid' : ''}`}>
              <label htmlFor="f-iznos">Iznos</label>
              <div className="input-affix">
                <input
                  id="f-iznos"
                  className="num"
                  inputMode="decimal"
                  value={iznos}
                  onChange={(e) => setIznos(e.target.value)}
                  onBlur={() => vrijednost > 0 && setIznos(broj(vrijednost))}
                  placeholder="0,00"
                />
                <span>KM</span>
              </div>
              {pokazi('iznos') && <span className="field-err">{greske.iznos}</span>}
            </div>
            <div className={`field${pokazi('datum') ? ' invalid' : ''}`}>
              <label htmlFor="f-datum">Datum</label>
              <input id="f-datum" type="date" className="num" value={datum} onChange={(e) => setDatum(e.target.value)} />
              {pokazi('datum') && <span className="field-err">{greske.datum}</span>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="f-kat">Kategorija</label>
            <select id="f-kat" value={kategorija} onChange={(e) => setKategorija(e.target.value)}>
              {kategorije.map((c) => (
                <option key={c.key} value={c.key}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            {uredjivanje && (
              <button type="button" className="btn danger" onClick={() => onObrisi(pocetna)}>
                <Icon name="trash" size={15} /> Obriši
              </button>
            )}
            <div className="right">
              <button type="button" className="btn ghost" onClick={onZatvori}>Odustani</button>
              <button type="submit" className="btn primary">{uredjivanje ? 'Spremi izmjene' : 'Dodaj stavku'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
