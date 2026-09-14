import { useEffect } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import { idi, trenutnaRuta, useRuta } from './lib/router.js'
import Landing from './pages/Landing.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'

const NASLOVI = {
  '/': 'Ledgerly — kućni budžet domaćinstva',
  '/prijava': 'Prijava — Ledgerly',
  '/registracija': 'Registracija — Ledgerly',
  '/dashboard': 'Pregled — Ledgerly',
}

// Preusmjerava samo ako je korisnik još uvijek na ruti koja je tražila
// preusmjerenje — inače bi npr. odjava (koja već vodi na početnu) završila na prijavi.
function Preusmjeri({ sa, na }) {
  useEffect(() => {
    if (trenutnaRuta() === sa) idi(na, { zamijeni: true })
  }, [sa, na])
  return null
}

function Rute() {
  const ruta = useRuta()
  const { korisnik } = useAuth()

  useEffect(() => {
    document.title = NASLOVI[ruta] ?? NASLOVI['/']
    window.scrollTo(0, 0)
  }, [ruta])

  if (ruta === '/dashboard') {
    if (!korisnik) return <Preusmjeri sa={ruta} na="/prijava" />
    return <Dashboard key={korisnik.email} />
  }

  if (ruta === '/prijava' || ruta === '/registracija') {
    if (korisnik) return <Preusmjeri sa={ruta} na="/dashboard" />
    return <AuthPage mod={ruta === '/prijava' ? 'prijava' : 'registracija'} />
  }

  return <Landing />
}

export default function App() {
  return (
    <AuthProvider>
      <Rute />
    </AuthProvider>
  )
}
