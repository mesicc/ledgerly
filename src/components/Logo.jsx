import { useId } from 'react'

// Znak Filuze: zlatni novčić s izdankom — ušteđevina koja raste.
// Isti crtež je i u public/favicon.svg; ako mijenjaš jedan, promijeni i drugi.
export default function Logo({ className = 'logo-mark' }) {
  // useId daje jedinstvene id-jeve gradijenata ako je na stranici više logoa.
  const id = useId().replace(/:/g, '')
  const lice = `${id}-lice`
  const rub = `${id}-rub`

  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={lice} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#F7D27A" />
          <stop offset="0.55" stopColor="#E4AA3E" />
          <stop offset="1" stopColor="#C98E27" />
        </radialGradient>
        <linearGradient id={rub} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E2A83C" />
          <stop offset="1" stopColor="#A87118" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#${rub})`} />
      <circle cx="32" cy="32" r="29" fill="none" stroke="#8F6012" strokeWidth="2.4" strokeDasharray="1.1 1.7" />
      <circle cx="32" cy="32" r="26" fill={`url(#${lice})`} />
      <circle cx="32" cy="32" r="22.5" fill="none" stroke="#A8731A" strokeWidth="1.2" opacity="0.75" />
      <g fill="#7A4C0E" stroke="#7A4C0E" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 45 V31" strokeWidth="3" fill="none" />
        <path d="M31 36 C23.5 36 19.5 31 19.5 24.5 C26.5 24.5 31 29 31 36 Z" strokeWidth="1" />
        <path d="M33 31 C33 24 37.5 19 44.5 19 C44.5 26 40 31 33 31 Z" strokeWidth="1" />
        <path d="M23 45.5 H41" strokeWidth="3" fill="none" />
      </g>
    </svg>
  )
}
