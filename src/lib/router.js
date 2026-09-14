import { useEffect, useState } from 'react'

// Minimalni hash router: #/, #/prijava, #/registracija, #/dashboard.
// Hash rute rade i kad se build otvori kao statična datoteka, bez podešavanja servera.

export const trenutnaRuta = () => window.location.hash.replace(/^#/, '').split('?')[0] || '/'

export function idi(putanja, { zamijeni = false } = {}) {
  if (zamijeni) window.location.replace(`#${putanja}`)
  else window.location.hash = putanja
}

export function useRuta() {
  const [ruta, setRuta] = useState(trenutnaRuta)
  useEffect(() => {
    const promjena = () => setRuta(trenutnaRuta())
    window.addEventListener('hashchange', promjena)
    return () => window.removeEventListener('hashchange', promjena)
  }, [])
  return ruta
}
