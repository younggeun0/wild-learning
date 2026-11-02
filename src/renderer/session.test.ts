import { describe, expect, it } from 'vitest'
import {
  type Action,
  type Session,
  current,
  laps,
  newSession,
  parseSession,
  reduce,
  stageLabel,
  stageOf,
} from './session'

const run = (actions: Action[], start = newSession(0)): Session => actions.reduce(reduce, start)
const nexts = (n: number, from = 1): Action[] => Array.from({ length: n }, (_, i) => ({ type: 'next', at: from + i }))

describe('session', () => {
  it('starts at option', () => {
    expect(current(newSession(0)).mode).toBe('option')
  })

  it('Space walks the cycle once, then on to map and back to option', () => {
    const states = nexts(6).reduce((acc, a) => [...acc, reduce(acc[acc.length - 1], a)], [newSession(0)])
    expect(states.map((s) => current(s).mode)).toEqual([
      'option',
      'hypothesis',
      'action',
      'observation',
      'interpretation',
      'map',
      'option',
    ])
  })

  it('counts a lap each time the piece moves from map to option', () => {
    expect(laps(run(nexts(5)))).toBe(0)
    expect(laps(run(nexts(6)))).toBe(1)
    expect(laps(run(nexts(12)))).toBe(2)
    expect(laps(run([...nexts(5), { type: 'jump', mode: 'option', at: 9 }]))).toBe(1)
    expect(laps(run([...nexts(1), { type: 'jump', mode: 'option', at: 9 }]))).toBe(0)
  })

  it('undo returns to the previous station and its lap count', () => {
    const s = run([...nexts(6), { type: 'undo' }])
    expect(current(s).mode).toBe('map')
    expect(laps(s)).toBe(0)
  })

  it('undo never removes the first visit', () => {
    const s = run([{ type: 'undo' }, { type: 'undo' }])
    expect(s.visits).toEqual([{ mode: 'option', at: 0 }])
  })

  it('jump moves anywhere and Space continues from there', () => {
    const s = run([...nexts(4), { type: 'jump', mode: 'action', at: 10 }, { type: 'next', at: 11 }])
    expect(current(s).mode).toBe('observation')
  })

  it('jump to the current station is a no-op', () => {
    const s = run(nexts(1))
    expect(reduce(s, { type: 'jump', mode: 'hypothesis', at: 99 })).toBe(s)
  })

  it('reset starts a new session at option', () => {
    expect(run([...nexts(8), { type: 'reset', at: 50 }])).toEqual(newSession(50))
  })

  it('the stage shown outside the widget names the quadrant, and the station only inside the loop', () => {
    const onHypothesis = run(nexts(1))
    expect(stageOf(onHypothesis)).toEqual({ mode: 'hypothesis', stage: '가설', substep: null })
    expect(stageLabel(stageOf(onHypothesis))).toBe('가설')

    const onObservation = run(nexts(3))
    expect(stageOf(onObservation)).toEqual({ mode: 'observation', stage: '액관해', substep: '관찰' })
    expect(stageLabel(stageOf(onObservation))).toBe('액관해·관찰')
  })

  it('parses only well-formed stored sessions', () => {
    expect(parseSession({ visits: [{ mode: 'map', at: 5 }] })).toEqual({ visits: [{ mode: 'map', at: 5 }] })
    expect(parseSession({ visits: [] })).toBeNull()
    expect(parseSession({ visits: [{ mode: 'nope', at: 5 }] })).toBeNull()
    expect(parseSession({ visits: [{ mode: 'map', at: 'x' }] })).toBeNull()
    expect(parseSession(null)).toBeNull()
  })
})
