import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { migrirajStariNaziv } from './lib/migracija.js'
import './styles.css'

// Mora se izvršiti prije nego što aplikacija pročita sesiju i podatke.
migrirajStariNaziv()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
