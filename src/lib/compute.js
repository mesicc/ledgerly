// Svi izvedeni brojevi dashboarda na jednom mjestu: sume, promjene, kante
// grafikona, kategorije, limiti i sažetak "Kako stojimo".

import { EXPENSE_CATEGORIES, MONTHLY_LIMITS, catName } from '../data/categories.js'
import { brojMjeseci, kante, prethodni, raspon } from './period.js'

export const uRasponu = (stavka, r) => stavka.date >= r.od && stavka.date <= r.do

export function uPeriodu(stavke, zrno, sidro) {
  const r = raspon(zrno, sidro)
  return stavke.filter((s) => uRasponu(s, r))
}

export function sume(stavke) {
  let uplate = 0
  let trosak = 0
  for (const s of stavke) {
    if (s.type === 'income') uplate += s.amount
    else trosak += s.amount
  }
  return { uplate, trosak, ostaje: uplate - trosak }
}

/**
 * Promjena u postotku u odnosu na prethodni period.
 * Vraća null kad prethodni period nema podataka — tada se prikazuje "—",
 * jer bi svaki postotak u odnosu na nulu bio izmišljen.
 */
export function promjena(sada, prije) {
  if (prije === 0) return null
  return ((sada - prije) / Math.abs(prije)) * 100
}

export function kpi(stavke, zrno, sidro) {
  const sada = sume(uPeriodu(stavke, zrno, sidro))
  const prijeStavke = uPeriodu(stavke, zrno, prethodni(zrno, sidro))
  const prije = sume(prijeStavke)
  const imaPrethodni = prijeStavke.length > 0
  const p = (a, b) => (imaPrethodni ? promjena(a, b) : null)
  return {
    sada,
    prije,
    imaPrethodni,
    promjene: {
      uplate: p(sada.uplate, prije.uplate),
      trosak: p(sada.trosak, prije.trosak),
      ostaje: p(sada.ostaje, prije.ostaje),
    },
  }
}

/** Stupci grafikona: po jedna vrijednost uplata i troškova za svaku kantu. */
export function serijeKrozVrijeme(stavke, zrno, sidro) {
  const k = kante(zrno, sidro)
  const prazno = k.map((b) => ({ ...b, uplate: 0, trosak: 0 }))
  const indeks = new Map(prazno.map((b, i) => [i, b]))
  for (const s of stavke) {
    for (let i = 0; i < prazno.length; i++) {
      const b = indeks.get(i)
      if (s.date >= b.od && s.date <= b.do) {
        if (s.type === 'income') b.uplate += s.amount
        else b.trosak += s.amount
        break
      }
    }
  }
  return prazno
}

/** Troškovi po kategoriji, od najvećeg prema najmanjem. */
export function poKategorijama(stavke) {
  const zbir = new Map()
  let ukupno = 0
  for (const s of stavke) {
    if (s.type !== 'expense') continue
    zbir.set(s.category, (zbir.get(s.category) ?? 0) + s.amount)
    ukupno += s.amount
  }
  const redovi = [...zbir.entries()]
    .map(([key, iznos]) => ({
      key,
      naziv: catName(key),
      iznos,
      udio: ukupno > 0 ? (iznos / ukupno) * 100 : 0,
      brojStavki: stavke.filter((s) => s.type === 'expense' && s.category === key).length,
    }))
    .sort((a, b) => b.iznos - a.iznos)
  return { redovi, ukupno }
}

/** Limiti skalirani na dužinu perioda (kvartal = 3×, godina = 12×). */
export function limiti(stavke, zrno) {
  const faktor = brojMjeseci(zrno)
  const potroseno = new Map()
  for (const s of stavke) {
    if (s.type !== 'expense') continue
    potroseno.set(s.category, (potroseno.get(s.category) ?? 0) + s.amount)
  }
  return EXPENSE_CATEGORIES.filter((c) => MONTHLY_LIMITS[c.key] != null)
    .map((c) => {
      const limit = MONTHLY_LIMITS[c.key] * faktor
      const iznos = potroseno.get(c.key) ?? 0
      const udio = limit > 0 ? (iznos / limit) * 100 : 0
      return {
        key: c.key,
        naziv: c.name,
        iznos,
        limit,
        udio,
        preostalo: limit - iznos,
        stanje: udio > 100 ? 'preko' : udio >= 80 ? 'blizu' : 'uredu',
      }
    })
    .sort((a, b) => b.udio - a.udio)
}

/** Podaci za panel "Kako stojimo". */
export function sazetak(stavke, zrno, sidro) {
  const period = uPeriodu(stavke, zrno, sidro)
  const { uplate, trosak, ostaje } = sume(period)

  // Prosjek se dijeli sa brojem mjeseci koji stvarno imaju bar jednu stavku,
  // da nepopunjeni mjeseci (npr. oktobar–decembar) ne razvodne prosjek.
  const mjeseci = new Set(period.map((s) => s.date.slice(0, 7)))
  const n = Math.max(mjeseci.size, 1)

  const troskovi = period.filter((s) => s.type === 'expense')
  const najveca = troskovi.reduce((a, b) => (b.amount > (a?.amount ?? -1) ? b : a), null)

  return {
    prosjecniPrihod: uplate / n,
    prosjecnaPotrosnja: trosak / n,
    // Koliko feninga od svake uplaćene marke ostane neutrošeno.
    odSvakeMarke: uplate > 0 ? ostaje / uplate : 0,
    najveca,
    brojStavki: period.length,
    brojMjeseciSPodacima: mjeseci.size,
    stopaStednje: uplate > 0 ? (ostaje / uplate) * 100 : 0,
  }
}
