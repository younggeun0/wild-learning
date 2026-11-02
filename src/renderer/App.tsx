import { useEffect, useReducer, useState } from 'react'
import './App.css'
import Board from './Board'
import ResizeHandle from './ResizeHandle'
import {
  STATIONS,
  type Session,
  current,
  dwell,
  laps,
  newSession,
  parseSession,
  reduce,
  stageLabel,
  stageSince,
} from './session'

const STORAGE_KEY = 'wild-learning.session'

function load(): Session {
  try {
    return parseSession(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')) ?? newSession(Date.now())
  } catch {
    return newSession(Date.now())
  }
}

function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const mmss = `${Math.floor(s / 60) % 60}:${String(s % 60).padStart(2, '0')}`
  return s >= 3600 ? `${Math.floor(s / 3600)}:${mmss.padStart(5, '0')}` : mmss
}

function useNow() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function App() {
  const [session, dispatch] = useReducer(reduce, undefined, load)
  const now = useNow()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      /* 저장 못 해도 이번 세션은 계속 쓴다 */
    }
  }, [session])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.repeat) return
      if (event.key === ' ') dispatch({ type: 'next', at: Date.now() })
      else if (event.key === 'Backspace') dispatch({ type: 'undo' })
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => window.wildLearning?.onAdvance(() => dispatch({ type: 'next', at: Date.now() })), [])

  const here = current(session)
  const totals = dwell(session, now)
  const label = stageLabel(here.mode)
  const since = stageSince(session)
  const elapsed = formatDuration(now - since)

  useEffect(() => window.wildLearning?.setTrayStage(label, since), [label, since])

  return (
    <main className="group/widget fixed inset-0 flex flex-col overflow-hidden rounded-xl bg-stone-50 text-stone-600 dark:bg-stone-900 dark:text-stone-300">
      <header data-tauri-drag-region className="flex h-6 shrink-0 items-center gap-2 px-2.5 text-[11px] tabular-nums">
        <div className="group relative flex min-w-0 items-baseline gap-1.5" data-testid="stats">
          <span className="truncate">
            {laps(session)}바퀴 · {label}
          </span>
          <span className="hidden shrink-0 text-[15px] font-bold text-stone-800 compact:inline dark:text-stone-100">
            {elapsed}
          </span>
          <dl className="absolute top-5 left-0 z-10 hidden grid-cols-[auto_auto] gap-x-3 rounded-md bg-white/95 px-2.5 dark:bg-stone-800/95 py-1.5 shadow-md group-hover:grid">
            {STATIONS.map((st) => (
              <div key={st.mode} className="contents">
                <dt>{st.label}</dt>
                <dd className="text-right">{formatDuration(totals[st.mode])}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div data-tauri-drag-region className="flex-1 self-stretch" />
        <button
          type="button"
          title="새 세션 (기록 지우기)"
          className="cursor-pointer rounded px-1 text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
          onClick={(event) => {
            event.currentTarget.blur()
            dispatch({ type: 'reset', at: Date.now() })
          }}
        >
          ↺
        </button>
      </header>
      <div className="min-h-0 flex-1 px-1 pb-1">
        <Board mode={here.mode} elapsed={elapsed} onJump={(mode) => dispatch({ type: 'jump', mode, at: Date.now() })} />
      </div>
      {window.wildLearning && <ResizeHandle />}
    </main>
  )
}
