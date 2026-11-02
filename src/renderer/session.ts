export type Mode = 'option' | 'hypothesis' | 'action' | 'observation' | 'interpretation' | 'map'

export type Quadrant = 'option' | 'hypothesis' | 'loop' | 'map'

export const ROWS = ['미래', '과거·현재'] as const
export const COLS = ['분산', '집중'] as const

export const QUADRANTS: Record<Quadrant, { label: string; row: (typeof ROWS)[number]; col: (typeof COLS)[number] }> = {
  option: { label: '옵션', row: '미래', col: '분산' },
  hypothesis: { label: '가설', row: '미래', col: '집중' },
  loop: { label: '액관해', row: '과거·현재', col: '집중' },
  map: { label: '지도', row: '과거·현재', col: '분산' },
}

export type Station = { mode: Mode; label: string; quadrant: Quadrant }

// Space 순서
export const STATIONS: readonly Station[] = [
  { mode: 'option', label: '옵션', quadrant: 'option' },
  { mode: 'hypothesis', label: '가설', quadrant: 'hypothesis' },
  { mode: 'action', label: '액션', quadrant: 'loop' },
  { mode: 'observation', label: '관찰', quadrant: 'loop' },
  { mode: 'interpretation', label: '해석', quadrant: 'loop' },
  { mode: 'map', label: '지도', quadrant: 'map' },
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

export const stepsOf = (quadrant: Quadrant): Station[] => STATIONS.filter((st) => st.quadrant === quadrant)

export function stageLabel(mode: Mode): string {
  const { quadrant, label } = station(mode)
  return stepsOf(quadrant).length > 1 ? `${QUADRANTS[quadrant].label}·${label}` : label
}

export const nextStation = (mode: Mode): Station =>
  STATIONS[(STATIONS.findIndex((st) => st.mode === mode) + 1) % STATIONS.length]

export function reduce(s: Session, a: Action): Session {
  switch (a.type) {
    case 'next':
      return { visits: [...s.visits, { mode: nextStation(current(s).mode).mode, at: a.at }] }
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

export function stageSince(s: Session): number {
  const quadrant = station(current(s).mode).quadrant
  let i = s.visits.length - 1
  while (i > 0 && station(s.visits[i - 1].mode).quadrant === quadrant) i--
  return s.visits[i].at
}

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
