import { catName } from '../data/categories.js'

const polje = (v) => `"${String(v).replace(/"/g, '""')}"`

// Točka-zarez i decimalni zarez: datoteka se otvara ispravno u Excelu
// podešenom za bosanski / evropski format.
export function napraviCSV(stavke) {
  const zaglavlje = ['Datum', 'Opis', 'Kategorija', 'Tip', 'Iznos (KM)']
  const redovi = stavke.map((s) => [
    s.date,
    polje(s.description),
    polje(catName(s.category)),
    s.type === 'income' ? 'Uplata' : 'Trošak',
    (s.type === 'income' ? '' : '-') + s.amount.toFixed(2).replace('.', ','),
  ])
  return '﻿' + [zaglavlje.join(';'), ...redovi.map((r) => r.join(';'))].join('\r\n')
}

export function preuzmi(sadrzaj, imeDatoteke) {
  const blob = new Blob([sadrzaj], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = imeDatoteke
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
