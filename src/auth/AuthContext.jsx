import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { odjavi, prijavi, registruj, trenutnaSesija } from './authService.js'

const AuthKontekst = createContext(null)

export function AuthProvider({ children }) {
  const [korisnik, setKorisnik] = useState(trenutnaSesija)

  const prijava = useCallback(async (podaci) => {
    const k = await prijavi(podaci)
    setKorisnik(k)
    return k
  }, [])

  const registracija = useCallback(async (podaci) => {
    const k = await registruj(podaci)
    setKorisnik(k)
    return k
  }, [])

  const odjava = useCallback(() => {
    odjavi()
    setKorisnik(null)
  }, [])

  const vrijednost = useMemo(() => ({ korisnik, prijava, registracija, odjava }), [korisnik, prijava, registracija, odjava])
  return <AuthKontekst.Provider value={vrijednost}>{children}</AuthKontekst.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthKontekst)
  if (!ctx) throw new Error('useAuth se mora koristiti unutar <AuthProvider>.')
  return ctx
}
