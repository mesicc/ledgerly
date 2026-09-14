import { useEffect, useState } from 'react'
import { sacuvajTekst } from './storage.js'

// Tema je zajednička za cijelu aplikaciju i pamti se između posjeta.
// index.html je primjenjuje prije prvog iscrtavanja, pa ovdje samo čitamo.
export function useTema() {
  const [tema, setTema] = useState(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  )
  useEffect(() => {
    document.documentElement.dataset.theme = tema
    sacuvajTekst('ledgerly.theme', tema)
  }, [tema])
  return [tema, () => setTema((t) => (t === 'dark' ? 'light' : 'dark'))]
}
