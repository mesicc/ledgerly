// Aplikacija se ranije zvala Ledgerly i podatke je čuvala pod ključevima "ledgerly.*".
// Pri pokretanju ih prebacujemo na "filuza.*" da korisnici ne izgube račune, stavke,
// sesiju i podešavanja. Ako novi ključ već postoji, ne prepisujemo ga.

const STARI = 'ledgerly.'
const NOVI = 'filuza.'

function prebaci(pohrana) {
  const stari = []
  for (let i = 0; i < pohrana.length; i++) {
    const k = pohrana.key(i)
    if (k && k.startsWith(STARI)) stari.push(k)
  }
  for (const k of stari) {
    const novi = NOVI + k.slice(STARI.length)
    if (pohrana.getItem(novi) == null) pohrana.setItem(novi, pohrana.getItem(k))
    pohrana.removeItem(k)
  }
}

export function migrirajStariNaziv() {
  for (const ime of ['localStorage', 'sessionStorage']) {
    try {
      prebaci(window[ime])
    } catch {
      /* pohrana nedostupna — nema se šta prebaciti */
    }
  }
}
