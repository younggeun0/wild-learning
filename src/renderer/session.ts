export type Mode = 'option' | 'hypothesis' | 'action' | 'observation' | 'interpretation' | 'map'

export type Station = { mode: Mode; label: string; x: number; y: number }

// Space 순서이자 보드 좌표(Board의 viewBox 기준)
export const STATIONS: readonly Station[] = [
  { mode: 'option', label: '옵션', x: 160, y: 70 },
  { mode: 'hypothesis', label: '가설', x: 285, y: 70 },
  { mode: 'action', label: '액션', x: 268, y: 192 },
  { mode: 'observation', label: '관찰', x: 331, y: 165 },
  { mode: 'interpretation', label: '해석', x: 331, y: 219 },
  { mode: 'map', label: '지도', x: 160, y: 192 },
]

export type Visit = { mode: Mode; at: number }
export type Session = { visits: Visit[] }
export type Action =
  | { type: 'next'; at: number }
  | { type: 'undo' }
  | { type: 'jump'; mode: Mode; at: number }
  | { type: 'reset'; at: number }

export const newSession = (at: number): Session => ({ visits: [{ mode: 'option', at }] })

export const current = (s: Session): Visit => s.visits[s.visits.length - 1]

export const station = (mode: Mode): Station => STATIONS.find((st) => st.mode === mode)!

export function reduce(s: Session, a: Action): Session {
  switch (a.type) {
    case 'next': {
      const i = STATIONS.findIndex((st) => st.mode === current(s).mode)
      return { visits: [...s.visits, { mode: STATIONS[(i + 1) % STATIONS.length].mode, at: a.at }] }
    }
    case 'undo':
      return s.visits.length > 1 ? { visits: s.visits.slice(0, -1) } : s
    case 'jump':
      return a.mode === current(s).mode ? s : { visits: [...s.visits, { mode: a.mode, at: a.at }] }
    case 'reset':
      return newSession(a.at)
  }
}

export const laps = (s: Session): number =>
  s.visits.filter((v, i) => i > 0 && v.mode === 'option' && s.visits[i - 1].mode === 'map').length

export function dwell(s: Session, now: number): Record<Mode, number> {
  const total = Object.fromEntries(STATIONS.map((st) => [st.mode, 0])) as Record<Mode, number>
  s.visits.forEach((v, i) => {
    total[v.mode] += (s.visits[i + 1]?.at ?? now) - v.at
  })
  return total
}

export function parseSession(raw: unknown): Session | null {
  const visits = (raw as Session | null)?.visits
  if (!Array.isArray(visits) || visits.length === 0) return null
  const valid = visits.every(
    (v) => STATIONS.some((st) => st.mode === v?.mode) && typeof v.at === 'number' && Number.isFinite(v.at),
  )
  return valid ? { visits: visits.map((v) => ({ mode: v.mode, at: v.at })) } : null
}
