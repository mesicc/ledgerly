import { describe, expect, it } from 'vitest'
import { migrirajStariNaziv } from './migracija.js'

describe('migrirajStariNaziv', () => {
  it('prebacuje ledgerly.* ključeve na filuza.* i briše stare', () => {
    localStorage.setItem('ledgerly.users.v1', '[{"email":"amila@primjer.ba"}]')
    localStorage.setItem('ledgerly.entries.v1:amila@primjer.ba', '[]')
    localStorage.setItem('ledgerly.theme', 'dark')
    sessionStorage.setItem('ledgerly.session.v1', '{"email":"amila@primjer.ba"}')
    localStorage.setItem('drugo', 'ostaje')

    migrirajStariNaziv()

    expect(localStorage.getItem('filuza.users.v1')).toBe('[{"email":"amila@primjer.ba"}]')
    expect(localStorage.getItem('filuza.entries.v1:amila@primjer.ba')).toBe('[]')
    expect(localStorage.getItem('filuza.theme')).toBe('dark')
    expect(sessionStorage.getItem('filuza.session.v1')).toBe('{"email":"amila@primjer.ba"}')
    expect(localStorage.getItem('ledgerly.users.v1')).toBeNull()
    expect(localStorage.getItem('ledgerly.theme')).toBeNull()
    expect(sessionStorage.getItem('ledgerly.session.v1')).toBeNull()
    expect(localStorage.getItem('drugo')).toBe('ostaje')
  })

  it('ne prepisuje postojeće filuza.* podatke', () => {
    localStorage.setItem('ledgerly.theme', 'dark')
    localStorage.setItem('filuza.theme', 'light')

    migrirajStariNaziv()

    expect(localStorage.getItem('filuza.theme')).toBe('light')
    expect(localStorage.getItem('ledgerly.theme')).toBeNull()
  })
})
