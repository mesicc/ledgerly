import { describe, expect, it } from 'vitest'
import { createSeedEntries } from './seed.js'

describe('primjer podataka', () => {
  it('je identičan pri svakom pozivu', () => {
    expect(createSeedEntries()).toEqual(createSeedEntries())
  })

  it('pokriva januar–septembar 2026. i ima jedinstvene id-eve', () => {
    const stavke = createSeedEntries()
    const datumi = stavke.map((s) => s.date).sort()
    expect(new Set(stavke.map((s) => s.id)).size).toBe(stavke.length)
    expect(datumi[0]).toBe('2026-01-01')
    expect(datumi.at(-1) <= '2026-09-30').toBe(true)
  })
})
