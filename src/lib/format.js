// Brojevi se pišu bosanski: tačka za hiljade, zarez za decimale — 1.234,56 KM.

const MINUS = '−' // pravi minus, ne crtica

function grupisi(cijeli) {
  return cijeli.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Osnovni zapis broja: 1.234,56 */
export function broj(vrijednost, decimala = 2) {
  const n = Number.isFinite(vrijednost) ? vrijednost : 0
  const neg = n < 0
  const [cijeli, dec] = Math.abs(n).toFixed(decimala).split('.')
  return (neg ? MINUS : '') + grupisi(cijeli) + (dec ? `,${dec}` : '')
}

/** Skraćeni zapis: 1,2k / 12k / 1,25M — koristi se kad je tweak uključen. */
export function brojSkraceno(vrijednost) {
  const n = Number.isFinite(vrijednost) ? vrijednost : 0
  const a = Math.abs(n)
  const znak = n < 0 ? MINUS : ''
  if (a >= 1_000_000) return znak + broj(a / 1_000_000, a >= 10_000_000 ? 1 : 2) + 'M'
  if (a >= 10_000) return znak + broj(a / 1000, 0) + 'k'
  if (a >= 1000) return znak + broj(a / 1000, 1) + 'k'
  return znak + broj(a, a % 1 === 0 ? 0 : 2)
}

/**
 * Iznos s valutom.
 * @param {number} vrijednost
 * @param {{skraceno?: boolean, valuta?: boolean, predznak?: boolean}} opcije
 */
export function km(vrijednost, opcije = {}) {
  const { skraceno = false, valuta = true, predznak = false } = opcije
  const n = Number.isFinite(vrijednost) ? vrijednost : 0
  const tijelo = skraceno ? brojSkraceno(n) : broj(n)
  const sPlusom = predznak && n > 0 ? `+${tijelo}` : tijelo
  return valuta ? `${sPlusom} KM` : sPlusom
}

/** Postotak promjene: +12,4 % / −3,1 % / — kad poređenja nema. */
export function postotak(vrijednost, decimala = 1) {
  if (vrijednost === null || !Number.isFinite(vrijednost)) return '—'
  const znak = vrijednost > 0 ? '+' : ''
  return `${znak}${broj(vrijednost, decimala)} %`
}

const MJESECI = [
  'januar', 'februar', 'mart', 'april', 'maj', 'juni',
  'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar',
]
const MJESECI_KRATKO = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
]

export const imeMjeseca = (m) => MJESECI[m]
export const imeMjesecaKratko = (m) => MJESECI_KRATKO[m]
export const veliko = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/** ISO datum (2026-03-05) u prikaz 5.3.2026. */
export function datum(isoDatum) {
  const [g, m, d] = isoDatum.split('-')
  return `${Number(d)}.${Number(m)}.${g}.`
}

/** ISO datum u prikaz "5. mart" — za uže kolone. */
export function datumKratko(isoDatum) {
  const [, m, d] = isoDatum.split('-')
  return `${Number(d)}. ${MJESECI_KRATKO[Number(m) - 1]}`
}

/** Bosanska množina: 1 stavka, 3 stavke, 7 stavki, 12 stavki, 21 stavka. */
export function mnozina(n, jedna, dvije, pet) {
  const d = n % 10
  const s = n % 100
  if (d === 1 && s !== 11) return jedna
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return dvije
  return pet
}
