// localStorage može baciti izuzetak (privatni prozor, blokirani podaci) —
// aplikacija tada radi normalno, samo bez pamćenja.

export function ucitaj(kljuc, zadano) {
  try {
    const v = localStorage.getItem(kljuc)
    return v == null ? zadano : JSON.parse(v)
  } catch {
    return zadano
  }
}

export function sacuvaj(kljuc, vrijednost) {
  try {
    localStorage.setItem(kljuc, JSON.stringify(vrijednost))
  } catch {
    /* bez pamćenja */
  }
}

export function ucitajTekst(kljuc) {
  try {
    return localStorage.getItem(kljuc)
  } catch {
    return null
  }
}

export function sacuvajTekst(kljuc, vrijednost) {
  try {
    localStorage.setItem(kljuc, vrijednost)
  } catch {
    /* bez pamćenja */
  }
}
