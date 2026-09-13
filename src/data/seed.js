// Izmišljeni, ali realistični podaci jednog sarajevskog domaćinstva,
// januar–septembar 2026. Generator je determinističan (fiksno sjeme), pa je
// skup podataka isti pri svakom pokretanju.

const MONTHS = 9 // januar .. septembar 2026
const YEAR = 2026

function lcg(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const rnd = lcg(20260913)
const between = (min, max) => min + rnd() * (max - min)
const money = (min, max, step = 0.05) =>
  Math.round(between(min, max) / step) * step

const iso = (y, m, d) => {
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const day = Math.min(d, last)
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

let seq = 0
const nextId = () => `e${String(++seq).padStart(4, '0')}`

const entry = (date, description, category, type, amount) => ({
  id: nextId(),
  date,
  description,
  category,
  type,
  amount: Math.round(amount * 100) / 100,
})

const NAMIRNICE = [
  'Bingo — sedmična kupovina',
  'Konzum — namirnice',
  'Pijaca Markale — voće i povrće',
  'Mercator — sedmična kupovina',
  'Amko komerc — namirnice',
  'Pekara i mesnica',
]

const GORIVO = ['Petrol — gorivo', 'Hifa — gorivo', 'INA — gorivo']

// Grijanje je centralno: računa ima od januara do aprila.
const GRIJANJE_MJESECI = [0, 1, 2, 3]
// Struja prati sezonu — zimi znatno više.
const STRUJA = [162, 155, 128, 96, 78, 74, 88, 92, 84]

function fiksniMjesecni() {
  const out = []
  for (let m = 0; m < MONTHS; m++) {
    // --- prihodi ---
    const plataAmila = m >= 6 ? 1520 : 1450 // povećanje od jula
    const plataNedim = m >= 4 ? 1225 : 1180 // povećanje od maja
    out.push(entry(iso(YEAR, m, 28), 'Plata — Amila', 'plata', 'income', plataAmila))
    out.push(entry(iso(YEAR, m, 5), 'Plata — Nedim', 'plata', 'income', plataNedim))

    // --- stanovanje i režije ---
    out.push(entry(iso(YEAR, m, 1), 'Stanarina — Grbavica', 'stanarina', 'expense', 550))
    out.push(entry(iso(YEAR, m, 12), 'Elektroprivreda — struja', 'rezije', 'expense', STRUJA[m] + between(-4, 4)))
    out.push(entry(iso(YEAR, m, 13), 'Vodovod i odvoz smeća', 'rezije', 'expense', money(38, 47)))
    if (GRIJANJE_MJESECI.includes(m)) {
      out.push(entry(iso(YEAR, m, 10), 'Toplane — grijanje', 'rezije', 'expense', money(96, 132)))
    }

    // --- namirnice: 4–5 kupovina mjesečno ---
    const dani = [3, 9, 16, 23, 29]
    const koliko = rnd() > 0.35 ? 5 : 4
    for (let i = 0; i < koliko; i++) {
      const opis = NAMIRNICE[(m * 2 + i) % NAMIRNICE.length]
      const velika = i === 0 || i === 3
      out.push(
        entry(iso(YEAR, m, dani[i]), opis, 'namirnice', 'expense',
          velika ? money(135, 205) : money(62, 128))
      )
    }

    // --- prijevoz ---
    out.push(entry(iso(YEAR, m, 7), GORIVO[m % GORIVO.length], 'gorivo', 'expense', money(58, 92)))
    out.push(entry(iso(YEAR, m, 21), GORIVO[(m + 1) % GORIVO.length], 'gorivo', 'expense', money(55, 90)))
    out.push(entry(iso(YEAR, m, 2), 'GRAS — mjesečna karta', 'prijevoz', 'expense', 30))

    // --- pretplate ---
    out.push(entry(iso(YEAR, m, 15), 'Telemach — internet i TV', 'pretplate', 'expense', 45))
    out.push(entry(iso(YEAR, m, 15), 'BH Telecom — mobilni', 'pretplate', 'expense', 38))
    out.push(entry(iso(YEAR, m, 18), 'Netflix', 'pretplate', 'expense', 14.9))
    out.push(entry(iso(YEAR, m, 20), 'Spotify — porodični', 'pretplate', 'expense', 9.9))

    // --- štednja ---
    out.push(entry(iso(YEAR, m, 28), 'Prenos na štedni račun', 'stednja', 'expense', m >= 6 ? 250 : 200))
  }
  return out
}

// Neredovni troškovi i dodatni prihodi kroz godinu.
const NEREDOVNI = [
  [0, 17, 'Zimnica i namirnice na veliko', 'namirnice', 'expense', 140],
  [1, 8, 'Zimska jakna — Nedim', 'odjeca', 'expense', 245],
  [1, 19, 'Honorar — prevod teksta', 'dodatni', 'income', 350],
  [2, 6, 'Ljetne gume — komplet', 'auto', 'expense', 380],
  [2, 14, 'Poklon za 8. mart', 'pokloni', 'expense', 85],
  [2, 22, 'Zubar — plomba', 'zdravlje', 'expense', 120],
  [3, 4, 'Zubar — vađenje umnjaka', 'zdravlje', 'expense', 240],
  [3, 17, 'Popravka mašine za veš', 'ostalo', 'expense', 165],
  [3, 25, 'Registracija vozila', 'auto', 'expense', 310],
  [4, 9, 'Honorar — fotografisanje vjenčanja', 'dodatni', 'income', 420],
  [4, 16, 'Ljekar — sistematski pregled', 'zdravlje', 'expense', 60],
  [4, 30, 'Poklon — rođendan', 'pokloni', 'expense', 70],
  [5, 6, 'Ljetna garderoba — djeca', 'odjeca', 'expense', 190],
  [5, 13, 'Servis klime', 'ostalo', 'expense', 90],
  [5, 27, 'Avans za ljetovanje — Neum', 'odmor', 'expense', 400],
  [6, 3, 'Regres', 'dodatni', 'income', 600],
  [6, 11, 'Ljetovanje — smještaj u Neumu', 'odmor', 'expense', 1150],
  [6, 14, 'Ljetovanje — hrana i izlasci', 'odmor', 'expense', 420],
  [6, 18, 'Ljetovanje — gorivo i putarine', 'odmor', 'expense', 145],
  [7, 5, 'Auto servis — mali', 'auto', 'expense', 180],
  [7, 14, 'Honorar — izrada web stranice', 'dodatni', 'income', 280],
  [7, 22, 'Poklon — vjenčanje', 'pokloni', 'expense', 150],
  [7, 29, 'Školski pribor', 'ostalo', 'expense', 130],
  [8, 2, 'Jesenja garderoba — djeca', 'odjeca', 'expense', 310],
  [8, 8, 'Udžbenici i lektira', 'ostalo', 'expense', 195],
  [8, 11, 'Apoteka — vitamini', 'zdravlje', 'expense', 45],
  [8, 24, 'Zimske gume — vulkanizer', 'auto', 'expense', 60],
]

export function createSeedEntries() {
  const out = [
    ...fiksniMjesecni(),
    ...NEREDOVNI.map(([m, d, opis, kat, tip, iznos]) =>
      entry(iso(YEAR, m, d), opis, kat, tip, iznos)
    ),
  ]
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1))
  return out
}

export const DATA_START = `${YEAR}-01-01`
export const DATA_END = `${YEAR}-09-30`
