// Autentikacija u browseru.
//
// Ova verzija Filuze nema server: računi se čuvaju u localStorage, a
// lozinke se nikad ne spremaju u čitljivom obliku — čuva se samo PBKDF2-SHA256
// hash sa nasumičnom soli po korisniku. To štiti lozinku ako neko pogleda
// spremljene podatke, ali NIJE zamjena za pravi backend: sve je u jednom browseru.
//
// Javne funkcije (registruj, prijavi, odjavi, trenutnaSesija) su jedini ugovor
// koji ostatak aplikacije koristi — za pravi server dovoljno ih je zamijeniti
// pozivima API-ja.

const KORISNICI = 'filuza.users.v1'
const SESIJA = 'filuza.session.v1'
const ITERACIJE = 150_000

export class AuthGreska extends Error {
  constructor(poruka, polje = null) {
    super(poruka)
    this.polje = polje
  }
}

const enc = new TextEncoder()
const uHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

function citaj(skladiste, kljuc) {
  try {
    const v = skladiste().getItem(kljuc)
    return v == null ? null : JSON.parse(v)
  } catch {
    return null
  }
}

function pisi(skladiste, kljuc, vrijednost) {
  try {
    if (vrijednost == null) skladiste().removeItem(kljuc)
    else skladiste().setItem(kljuc, JSON.stringify(vrijednost))
    return true
  } catch {
    return false
  }
}

const lokalno = () => window.localStorage
const sesijsko = () => window.sessionStorage

const sviKorisnici = () => citaj(lokalno, KORISNICI) ?? {}
export const normalizujEmail = (email) => String(email).trim().toLowerCase()

async function hashLozinke(lozinka, sol) {
  if (!globalThis.crypto?.subtle) {
    throw new AuthGreska('Browser ne podržava sigurno hashiranje. Otvorite aplikaciju preko https ili localhost adrese.')
  }
  const kljuc = await crypto.subtle.importKey('raw', enc.encode(lozinka), 'PBKDF2', false, ['deriveBits'])
  const bitovi = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(sol), iterations: ITERACIJE, hash: 'SHA-256' },
    kljuc,
    256
  )
  return uHex(bitovi)
}

// Poređenje u konstantnom vremenu, da trajanje ne otkriva koliko se hash poklapa.
function jednako(a, b) {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

const javniPodaci = (k) => ({ email: k.email, ime: k.ime, primjer: Boolean(k.primjer) })

function otvoriSesiju(korisnik, zapamti) {
  const sesija = { email: korisnik.email, otvorena: new Date().toISOString() }
  pisi(sesijsko, SESIJA, null)
  pisi(lokalno, SESIJA, null)
  if (!pisi(zapamti ? lokalno : sesijsko, SESIJA, sesija)) {
    throw new AuthGreska('Browser ne dozvoljava spremanje podataka (možda je privatni prozor).')
  }
  return javniPodaci(korisnik)
}

export async function registruj({ ime, email, lozinka, primjer = true }) {
  const kljuc = normalizujEmail(email)
  const korisnici = sviKorisnici()
  if (korisnici[kljuc]) throw new AuthGreska('Račun s ovom e-mail adresom već postoji.', 'email')

  const sol = uHex(crypto.getRandomValues(new Uint8Array(16)))
  const korisnik = {
    ime: String(ime).trim(),
    email: kljuc,
    sol,
    hash: await hashLozinke(lozinka, sol),
    primjer: Boolean(primjer),
    kreiran: new Date().toISOString(),
  }
  korisnici[kljuc] = korisnik
  if (!pisi(lokalno, KORISNICI, korisnici)) {
    throw new AuthGreska('Browser ne dozvoljava spremanje podataka (možda je privatni prozor).')
  }
  return otvoriSesiju(korisnik, true)
}

export async function prijavi({ email, lozinka, zapamti = true }) {
  const korisnik = sviKorisnici()[normalizujEmail(email)]
  // Hash se računa i kad račun ne postoji, da odgovor ne otkriva koji e-mailovi su registrovani.
  const hash = await hashLozinke(lozinka, korisnik?.sol ?? 'nepostojeci-racun')
  if (!korisnik || !jednako(hash, korisnik.hash)) {
    throw new AuthGreska('Pogrešna e-mail adresa ili lozinka.')
  }
  return otvoriSesiju(korisnik, zapamti)
}

export function odjavi() {
  pisi(sesijsko, SESIJA, null)
  pisi(lokalno, SESIJA, null)
}

export function trenutnaSesija() {
  const sesija = citaj(sesijsko, SESIJA) ?? citaj(lokalno, SESIJA)
  if (!sesija?.email) return null
  const korisnik = sviKorisnici()[sesija.email]
  return korisnik ? javniPodaci(korisnik) : null
}
