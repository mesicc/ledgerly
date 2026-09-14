import { describe, expect, it } from 'vitest'
import { AuthGreska, odjavi, prijavi, registruj, trenutnaSesija } from './authService.js'

const AMILA = { ime: 'Amila Hodžić', email: 'amila@primjer.ba', lozinka: 'tajna1234' }
const SESIJA = 'ledgerly.session.v1'
const KORISNICI = 'ledgerly.users.v1'

describe('authService — registracija', () => {
  it('pravi račun, normalizuje e-mail i odmah otvara zapamćenu sesiju', async () => {
    const k = await registruj({ ...AMILA, email: '  Amila@Primjer.BA ' })

    expect(k).toEqual({ email: 'amila@primjer.ba', ime: 'Amila Hodžić', primjer: true })
    expect(trenutnaSesija()).toEqual(k)
    expect(localStorage.getItem(SESIJA)).not.toBeNull()
  })

  it('pamti izbor bez primjera podataka', async () => {
    const k = await registruj({ ...AMILA, primjer: false })
    expect(k.primjer).toBe(false)
  })

  it('ne sprema lozinku u čitljivom obliku i koristi drugu so za svaki račun', async () => {
    await registruj(AMILA)
    await registruj({ ...AMILA, email: 'nedim@primjer.ba' })

    const sirovo = localStorage.getItem(KORISNICI)
    expect(sirovo).not.toContain('tajna1234')

    const k = JSON.parse(sirovo)
    expect(k['amila@primjer.ba'].hash).toMatch(/^[0-9a-f]{64}$/)
    expect(k['amila@primjer.ba'].sol).not.toBe(k['nedim@primjer.ba'].sol)
    // Ista lozinka, različita so → različit hash.
    expect(k['amila@primjer.ba'].hash).not.toBe(k['nedim@primjer.ba'].hash)
  })

  it('odbija drugi račun s istim e-mailom, bez obzira na velika slova', async () => {
    await registruj(AMILA)
    await expect(registruj({ ...AMILA, email: 'AMILA@primjer.ba' })).rejects.toMatchObject({
      polje: 'email',
      message: 'Račun s ovom e-mail adresom već postoji.',
    })
    expect(Object.keys(JSON.parse(localStorage.getItem(KORISNICI)))).toEqual(['amila@primjer.ba'])
  })
})

describe('authService — prijava i odjava', () => {
  it('prijavljuje s ispravnom lozinkom; e-mail nije osjetljiv na velika slova', async () => {
    await registruj(AMILA)
    odjavi()

    const k = await prijavi({ email: ' AMILA@primjer.ba', lozinka: 'tajna1234' })
    expect(k.email).toBe('amila@primjer.ba')
    expect(trenutnaSesija()).toEqual(k)
  })

  it('za pogrešnu lozinku i nepostojeći račun daje istu poruku i ne otvara sesiju', async () => {
    await registruj(AMILA)
    odjavi()

    const pogresna = await prijavi({ email: AMILA.email, lozinka: 'pogresna99' }).catch((e) => e)
    const nepostojeci = await prijavi({ email: 'nema@primjer.ba', lozinka: 'pogresna99' }).catch((e) => e)

    expect(pogresna).toBeInstanceOf(AuthGreska)
    expect(pogresna.message).toBe('Pogrešna e-mail adresa ili lozinka.')
    expect(nepostojeci.message).toBe(pogresna.message)
    expect(pogresna.polje).toBeNull()
    expect(trenutnaSesija()).toBeNull()
  })

  it('lozinka je osjetljiva na velika slova', async () => {
    await registruj(AMILA)
    odjavi()
    await expect(prijavi({ email: AMILA.email, lozinka: 'TAJNA1234' })).rejects.toThrow(AuthGreska)
  })

  it('bez "zapamti me" sesija živi samo u sessionStorage', async () => {
    await registruj(AMILA)
    odjavi()
    await prijavi({ email: AMILA.email, lozinka: AMILA.lozinka, zapamti: false })

    expect(sessionStorage.getItem(SESIJA)).not.toBeNull()
    expect(localStorage.getItem(SESIJA)).toBeNull()
    expect(trenutnaSesija()?.email).toBe(AMILA.email)
  })

  it('odjava briše sesiju iz oba skladišta', async () => {
    await registruj(AMILA)
    await prijavi({ email: AMILA.email, lozinka: AMILA.lozinka, zapamti: false })
    odjavi()

    expect(sessionStorage.getItem(SESIJA)).toBeNull()
    expect(localStorage.getItem(SESIJA)).toBeNull()
    expect(trenutnaSesija()).toBeNull()
  })

  it('sesija ne važi ako račun više ne postoji', async () => {
    await registruj(AMILA)
    localStorage.removeItem(KORISNICI)
    expect(trenutnaSesija()).toBeNull()
  })

  it('oštećeni podaci u skladištu ne ruše aplikaciju', () => {
    localStorage.setItem(SESIJA, '{ovo nije json')
    localStorage.setItem(KORISNICI, 'ni ovo')
    expect(trenutnaSesija()).toBeNull()
  })
})
