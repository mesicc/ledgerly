// Cijeli tok kroz aplikaciju, onako kako ga korisnik prolazi: klikovi i kucanje
// u stvarnim formama, preusmjeravanja između ruta i sadržaj dashboarda.

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App.jsx'
import { odjavi, registruj, trenutnaSesija } from '../auth/authService.js'

const AMILA = { ime: 'Amila Hodžić', email: 'amila@primjer.ba', lozinka: 'tajna1234' }

const otvori = (hash) => {
  window.history.replaceState(null, '', `/${hash}`)
  const user = userEvent.setup()
  render(<App />)
  return user
}

const naRuti = (hash) => waitFor(() => expect(window.location.hash).toBe(hash), { timeout: 8000 })

async function popuniRegistraciju(user, podaci = {}) {
  const { ime = AMILA.ime, email = AMILA.email, lozinka = AMILA.lozinka, potvrda = lozinka, primjer = true } = podaci
  if (ime) await user.type(screen.getByLabelText('Ime'), ime)
  if (email) await user.type(screen.getByLabelText('E-mail adresa'), email)
  if (lozinka) await user.type(screen.getByLabelText('Lozinka'), lozinka)
  if (potvrda) await user.type(screen.getByLabelText('Ponovite lozinku'), potvrda)
  if (!primjer) await user.click(screen.getByLabelText(/Učitaj primjer podataka/))
  await user.click(screen.getByRole('button', { name: 'Napravi račun' }))
}

async function popuniPrijavu(user, { email = AMILA.email, lozinka = AMILA.lozinka, zapamti = true } = {}) {
  await user.type(screen.getByLabelText('E-mail adresa'), email)
  await user.type(screen.getByLabelText('Lozinka'), lozinka)
  if (!zapamti) await user.click(screen.getByLabelText('Zapamti me na ovom računaru'))
  await user.click(screen.getByRole('button', { name: 'Prijavi se' }))
}

const dashboardJeOtvoren = async (ime = AMILA.ime) => {
  await naRuti('#/dashboard')
  expect(await screen.findByRole('button', { name: `Korisnički meni: ${ime}` })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Kretanje kroz vrijeme' })).toBeInTheDocument()
}

describe('početna stranica', () => {
  it('neprijavljenom korisniku nudi registraciju i prijavu', async () => {
    const user = otvori('#/')
    expect(screen.getByRole('heading', { level: 1, name: 'Znajte gdje ide svaka marka.' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Registruj se' }))
    await naRuti('#/registracija')
    expect(await screen.findByRole('heading', { name: 'Napravite račun' })).toBeInTheDocument()
  })

  it('prijavljenom korisniku nudi povratak na dashboard', async () => {
    await registruj(AMILA)
    otvori('#/')
    const meni = within(screen.getByRole('navigation', { name: 'Glavna navigacija' }))
    expect(meni.getByRole('link', { name: /Otvori pregled/ })).toHaveAttribute('href', '#/dashboard')
    expect(meni.queryByRole('link', { name: 'Prijava' })).not.toBeInTheDocument()
  })
})

describe('registracija', () => {
  it('prazna forma pokazuje greške i ne pravi račun', async () => {
    const user = otvori('#/registracija')
    await user.click(screen.getByRole('button', { name: 'Napravi račun' }))

    expect(screen.getByText('Upišite ime.')).toBeInTheDocument()
    expect(screen.getByText('Upišite ispravnu e-mail adresu.')).toBeInTheDocument()
    expect(screen.getByText('Lozinka mora imati najmanje 8 znakova.')).toBeInTheDocument()
    expect(screen.getByLabelText('Ime')).toHaveFocus()
    expect(localStorage.getItem('ledgerly.users.v1')).toBeNull()
    expect(window.location.hash).toBe('#/registracija')
  })

  it('odbija neispravan e-mail, kratku lozinku i lozinke koje se ne podudaraju', async () => {
    const user = otvori('#/registracija')

    await popuniRegistraciju(user, { email: 'amila@primjer', lozinka: 'kratka', potvrda: 'kratka' })
    expect(screen.getByText('Upišite ispravnu e-mail adresu.')).toBeInTheDocument()
    expect(screen.getByText('Lozinka mora imati najmanje 8 znakova.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('E-mail adresa'))
    await user.type(screen.getByLabelText('E-mail adresa'), AMILA.email)
    await user.clear(screen.getByLabelText('Lozinka'))
    await user.type(screen.getByLabelText('Lozinka'), 'tajna1234')
    await user.clear(screen.getByLabelText('Ponovite lozinku'))
    await user.type(screen.getByLabelText('Ponovite lozinku'), 'tajna12345')
    await user.click(screen.getByRole('button', { name: 'Napravi račun' }))

    expect(screen.getByText('Lozinke se ne podudaraju.')).toBeInTheDocument()
    expect(localStorage.getItem('ledgerly.users.v1')).toBeNull()
  })

  it('uspješna registracija otvara dashboard s primjerom podataka', async () => {
    const user = otvori('#/registracija')
    await popuniRegistraciju(user)

    await dashboardJeOtvoren()
    expect(screen.getByRole('button', { name: 'Korisnički meni: Amila Hodžić' })).toHaveTextContent('AH')
    expect(screen.getByText('Septembar 2026.')).toBeInTheDocument()
    expect(screen.getAllByText('Plata — Amila').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Dobro došli/)).not.toBeInTheDocument()
    expect(trenutnaSesija()).toEqual({ email: AMILA.email, ime: AMILA.ime, primjer: true })
  })

  it('bez primjera podataka otvara prazan dashboard s dobrodošlicom', async () => {
    const user = otvori('#/registracija')
    await popuniRegistraciju(user, { primjer: false })

    await dashboardJeOtvoren()
    expect(screen.getByText('Dobro došli, Amila Hodžić.')).toBeInTheDocument()
    expect(screen.queryByText('Plata — Amila')).not.toBeInTheDocument()
  })

  it('isti e-mail se ne može registrovati dvaput', async () => {
    await registruj(AMILA)
    odjavi()

    const user = otvori('#/registracija')
    await popuniRegistraciju(user, { ime: 'Druga Amila', email: 'Amila@Primjer.ba' })

    expect(await screen.findByText('Račun s ovom e-mail adresom već postoji.')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/registracija')
    expect(trenutnaSesija()).toBeNull()
  })
})

describe('prijava', () => {
  it('pogrešna lozinka pokazuje grešku, ispravna otvara dashboard', async () => {
    await registruj(AMILA)
    odjavi()

    const user = otvori('#/prijava')
    await popuniPrijavu(user, { lozinka: 'pogresna99' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Pogrešna e-mail adresa ili lozinka.')
    expect(window.location.hash).toBe('#/prijava')

    await user.clear(screen.getByLabelText('Lozinka'))
    await user.type(screen.getByLabelText('Lozinka'), AMILA.lozinka)
    await user.click(screen.getByRole('button', { name: 'Prijavi se' }))

    await dashboardJeOtvoren()
  })

  it('nepostojeći račun daje istu poruku kao pogrešna lozinka', async () => {
    const user = otvori('#/prijava')
    await popuniPrijavu(user, { email: 'nema@primjer.ba' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Pogrešna e-mail adresa ili lozinka.')
  })

  it('bez "Zapamti me" sesija se ne sprema trajno', async () => {
    await registruj(AMILA)
    odjavi()

    const user = otvori('#/prijava')
    await popuniPrijavu(user, { zapamti: false })
    await dashboardJeOtvoren()

    expect(sessionStorage.getItem('ledgerly.session.v1')).not.toBeNull()
    expect(localStorage.getItem('ledgerly.session.v1')).toBeNull()
  })

  it('dugme za prikaz lozinke mijenja tip polja', async () => {
    const user = otvori('#/prijava')
    const polje = screen.getByLabelText('Lozinka')
    expect(polje).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Prikaži lozinku' }))
    expect(polje).toHaveAttribute('type', 'text')
  })

  it('prelazak na registraciju zadržava upisani e-mail', async () => {
    const user = otvori('#/prijava')
    await user.type(screen.getByLabelText('E-mail adresa'), AMILA.email)
    await user.click(screen.getByRole('link', { name: 'Registracija' }))

    await naRuti('#/registracija')
    expect(await screen.findByLabelText('Ime')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail adresa')).toHaveValue(AMILA.email)
  })
})

describe('zaštita dashboarda i odjava', () => {
  it('neprijavljen korisnik koji otvori dashboard završi na prijavi', async () => {
    otvori('#/dashboard')
    await naRuti('#/prijava')
    expect(await screen.findByRole('heading', { name: 'Prijavite se' })).toBeInTheDocument()
  })

  it('prijavljen korisnik koji otvori prijavu ide pravo na dashboard', async () => {
    await registruj(AMILA)
    otvori('#/prijava')
    await dashboardJeOtvoren()
  })

  it('odjava vraća na početnu i ponovo zaključava dashboard', async () => {
    await registruj(AMILA)
    const user = otvori('#/dashboard')
    await dashboardJeOtvoren()

    await user.click(screen.getByRole('button', { name: 'Korisnički meni: Amila Hodžić' }))
    expect(screen.getByText(AMILA.email)).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Odjava' }))

    await naRuti('#/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Znajte gdje ide svaka marka.' })).toBeInTheDocument()
    expect(trenutnaSesija()).toBeNull()

    window.location.hash = '#/dashboard'
    await naRuti('#/prijava')
  })

  it('svaki korisnik vidi samo svoje stavke', async () => {
    await registruj(AMILA) // s primjerom podataka
    odjavi()
    await registruj({ ime: 'Nedim Kovač', email: 'nedim@primjer.ba', lozinka: 'lozinka123', primjer: false })

    const user = otvori('#/dashboard')
    await dashboardJeOtvoren('Nedim Kovač')
    expect(screen.getByText('Dobro došli, Nedim Kovač.')).toBeInTheDocument()
    expect(screen.queryByText('Plata — Amila')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Korisnički meni: Nedim Kovač' }))
    await user.click(screen.getByRole('menuitem', { name: 'Odjava' }))
    await naRuti('#/')

    await user.click(screen.getByRole('link', { name: 'Prijava' }))
    await naRuti('#/prijava')
    await screen.findByRole('heading', { name: 'Prijavite se' })
    await popuniPrijavu(user)

    await dashboardJeOtvoren()
    expect(screen.queryByText(/Dobro došli/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Plata — Amila').length).toBeGreaterThan(0)
  })
})
