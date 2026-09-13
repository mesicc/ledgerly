// Period ima zrno (mjesec / kvartal / godina) i sidro (godina + mjesec početka).
// Sve tabele i grafikoni računaju se iz raspona koji period daje.

import { imeMjeseca, imeMjesecaKratko, veliko } from './format.js'

export const ZRNA = [
  { key: 'month', label: 'Mjesec' },
  { key: 'quarter', label: 'Kvartal' },
  { key: 'year', label: 'Godina' },
]

export const GRANICE = { minGodina: 2026, minMjesec: 0, maxGodina: 2026, maxMjesec: 8 }

const pad = (n) => String(n).padStart(2, '0')
export const isoDan = (g, m, d) => `${g}-${pad(m + 1)}-${pad(d)}`
const zadnjiDan = (g, m) => new Date(Date.UTC(g, m + 1, 0)).getUTCDate()

/** Sidro poravnato na početak svog zrna. */
export function poravnaj(zrno, sidro) {
  const { godina, mjesec } = sidro
  if (zrno === 'month') return { godina, mjesec }
  if (zrno === 'quarter') return { godina, mjesec: Math.floor(mjesec / 3) * 3 }
  return { godina, mjesec: 0 }
}

export function brojMjeseci(zrno) {
  return zrno === 'month' ? 1 : zrno === 'quarter' ? 3 : 12
}

/** Raspon perioda kao ISO datumi, uključivo. */
export function raspon(zrno, sidro) {
  const s = poravnaj(zrno, sidro)
  const n = brojMjeseci(zrno)
  const krajMjesec = s.mjesec + n - 1
  const krajGodina = s.godina + Math.floor(krajMjesec / 12)
  const km = krajMjesec % 12
  return {
    od: isoDan(s.godina, s.mjesec, 1),
    do: isoDan(krajGodina, km, zadnjiDan(krajGodina, km)),
  }
}

export function oznaka(zrno, sidro) {
  const s = poravnaj(zrno, sidro)
  if (zrno === 'month') return `${veliko(imeMjeseca(s.mjesec))} ${s.godina}.`
  if (zrno === 'quarter') {
    const q = Math.floor(s.mjesec / 3) + 1
    const zadnji = imeMjesecaKratko(s.mjesec + 2)
    return `${q}. kvartal ${s.godina}. · ${imeMjesecaKratko(s.mjesec)}–${zadnji}`
  }
  return `Godina ${s.godina}.`
}

/** Kratka oznaka za izvoz i podnaslove. */
export function oznakaKratka(zrno, sidro) {
  const s = poravnaj(zrno, sidro)
  if (zrno === 'month') return `${imeMjesecaKratko(s.mjesec)}-${s.godina}`
  if (zrno === 'quarter') return `Q${Math.floor(s.mjesec / 3) + 1}-${s.godina}`
  return String(s.godina)
}

export function pomjeri(zrno, sidro, smjer) {
  const s = poravnaj(zrno, sidro)
  const korak = brojMjeseci(zrno) * smjer
  const ukupno = s.godina * 12 + s.mjesec + korak
  return { godina: Math.floor(ukupno / 12), mjesec: ((ukupno % 12) + 12) % 12 }
}

export const prethodni = (zrno, sidro) => pomjeri(zrno, sidro, -1)

/** Da li pomak ostaje unutar raspona za koji uopće imamo podatke. */
export function dozvoljen(zrno, sidro) {
  const s = poravnaj(zrno, sidro)
  const v = s.godina * 12 + s.mjesec
  const min = GRANICE.minGodina * 12 + GRANICE.minMjesec
  const max = GRANICE.maxGodina * 12 + GRANICE.maxMjesec
  if (zrno === 'year') return s.godina >= GRANICE.minGodina && s.godina <= GRANICE.maxGodina
  return v >= min - (brojMjeseci(zrno) - 1) && v <= max
}

export const naslovLimita = (zrno) =>
  zrno === 'month' ? 'Mjesečni limiti' : zrno === 'quarter' ? 'Kvartalni limiti' : 'Godišnji limiti'

/**
 * Podjela perioda na stupce grafikona:
 * mjesec -> sedmice, kvartal -> 3 mjeseca, godina -> 12 mjeseci.
 */
export function kante(zrno, sidro) {
  const s = poravnaj(zrno, sidro)
  if (zrno === 'month') {
    const zadnji = zadnjiDan(s.godina, s.mjesec)
    const out = []
    for (let pocetak = 1; pocetak <= zadnji; pocetak += 7) {
      const kraj = Math.min(pocetak + 6, zadnji)
      out.push({
        key: `w${pocetak}`,
        label: `${pocetak}–${kraj}`,
        opis: `${pocetak}. – ${kraj}. ${imeMjeseca(s.mjesec)}`,
        od: isoDan(s.godina, s.mjesec, pocetak),
        do: isoDan(s.godina, s.mjesec, kraj),
      })
    }
    return out
  }
  const n = brojMjeseci(zrno)
  return Array.from({ length: n }, (_, i) => {
    const ukupno = s.godina * 12 + s.mjesec + i
    const g = Math.floor(ukupno / 12)
    const m = ((ukupno % 12) + 12) % 12
    return {
      key: `${g}-${pad(m + 1)}`,
      label: imeMjesecaKratko(m),
      opis: `${veliko(imeMjeseca(m))} ${g}.`,
      od: isoDan(g, m, 1),
      do: isoDan(g, m, zadnjiDan(g, m)),
    }
  })
}
