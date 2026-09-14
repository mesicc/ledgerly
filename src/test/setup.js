import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, vi } from 'vitest'

// jsdom nema crypto.subtle — koristimo Nodeov WebCrypto, isti API kao u browseru.
vi.stubGlobal('crypto', webcrypto)

// API-ji koje jsdom ne implementira, a aplikacija ih koristi.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub)
window.scrollTo = () => {}
Element.prototype.scrollIntoView = function () {}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  // Vrati URL na početnu bez okidanja hashchange događaja.
  window.history.replaceState(null, '', '/')
  document.documentElement.dataset.theme = 'light'
  // Dashboard otvara "današnji" mjesec; zamrzni datum da testovi ne zavise od kalendara.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-14T10:00:00') })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
