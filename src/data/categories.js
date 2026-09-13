// Kategorije nose svoju boju kao trajnu oznaku identiteta. Boja nikad ne stoji
// sama: uz nju uvijek ide i naziv kategorije (tačka + tekst), pa je čitljivost
// nezavisna od raspoznavanja boja.

export const INCOME = 'income'
export const EXPENSE = 'expense'

export const CATEGORIES = [
  // --- prihodi ---
  { key: 'plata',     name: 'Plata',            type: INCOME,  light: '#0E6B45', dark: '#2FA07A' },
  { key: 'dodatni',   name: 'Dodatni prihod',   type: INCOME,  light: '#5C8A10', dark: '#86B33C' },
  // --- rashodi ---
  { key: 'stanarina', name: 'Stanarina',        type: EXPENSE, light: '#2F5FA0', dark: '#7FA5DE' },
  { key: 'rezije',    name: 'Režije',           type: EXPENSE, light: '#07837A', dark: '#37B0A6' },
  { key: 'namirnice', name: 'Namirnice',        type: EXPENSE, light: '#B4761A', dark: '#DEA53E' },
  { key: 'gorivo',    name: 'Gorivo',           type: EXPENSE, light: '#9C4A14', dark: '#D2793A' },
  { key: 'prijevoz',  name: 'Gradski prijevoz', type: EXPENSE, light: '#1C7FA8', dark: '#4FAED4' },
  { key: 'pretplate', name: 'Pretplate',        type: EXPENSE, light: '#5B3FB0', dark: '#9585E8' },
  { key: 'stednja',   name: 'Štednja',          type: EXPENSE, light: '#7A6A00', dark: '#B5A63F' },
  { key: 'zdravlje',  name: 'Zdravlje',         type: EXPENSE, light: '#BC2E63', dark: '#E86D96' },
  { key: 'odjeca',    name: 'Odjeća',           type: EXPENSE, light: '#8636A4', dark: '#C77FDB' },
  { key: 'odmor',     name: 'Odmor',            type: EXPENSE, light: '#D0561F', dark: '#E8814F' },
  { key: 'auto',      name: 'Auto',             type: EXPENSE, light: '#A0522D', dark: '#C08A63' },
  { key: 'pokloni',   name: 'Pokloni',          type: EXPENSE, light: '#B0203A', dark: '#E06A72' },
  { key: 'ostalo',    name: 'Ostalo',           type: EXPENSE, light: '#7D7264', dark: '#A3988A' },
]

export const CAT_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))
export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.type === EXPENSE)
export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.type === INCOME)

export const catName = (key) => CAT_BY_KEY[key]?.name ?? 'Nepoznato'
export const catColor = (key, theme) =>
  theme === 'dark' ? (CAT_BY_KEY[key]?.dark ?? '#A3988A') : (CAT_BY_KEY[key]?.light ?? '#7D7264')

// Mjesečni limit potrošnje po kategoriji, u KM. Kategorije bez limita se ne
// prate u panelu limita (neredovni troškovi se ne planiraju mjesečno).
export const MONTHLY_LIMITS = {
  stanarina: 550,
  rezije: 260,
  namirnice: 720,
  gorivo: 170,
  prijevoz: 40,
  pretplate: 115,
  stednja: 250,
  zdravlje: 100,
  odjeca: 120,
  ostalo: 150,
}
