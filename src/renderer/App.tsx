import { useEffect, useMemo, useReducer, useState } from 'react'
import './App.css'
import Board from './Board'
import { GuideOverlay } from './Guide'
import ResizeHandle from './ResizeHandle'
import {
  type Session,
  current,
  laps,
  newSession,
  parseSession,
  reduce,
  stageLabel,
  stageOf,
} from './session'

const STORAGE_KEY = 'wild-learning.session'
const GUIDE_SEEN_KEY = 'wild-learning.guide-seen'

function firstGuide(): boolean {
  try {
    if (localStorage.getItem(GUIDE_SEEN_KEY) !== null) return false
    localStorage.setItem(GUIDE_SEEN_KEY, '1')
    return true
  } catch {
    return false
  }
}

// 데스크톱은 작은 위젯 대신 따로 창을 띄운다
function showGuide(openOverlay: () => void) {
  if (window.wildLearning) window.wildLearning.openGuide()
  else openOverlay()
}

function load(): Session {
  try {
    return parseSession(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')) ?? newSession(Date.now())
  } catch {
    return newSession(Date.now())
  }
}

export default function App() {
  const [session, dispatch] = useReducer(reduce, undefined, load)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      /* 저장 못 해도 이번 세션은 계속 쓴다 */
    }
  }, [session])

  useEffect(() => {
    if (firstGuide()) showGuide(() => setGuideOpen(true))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.repeat) {
        if (guideOpen) setGuideOpen(false)
        else showGuide(() => setGuideOpen(true))
        event.preventDefault()
        return
      }
      if (guideOpen) {
        if (event.key === 'Escape') setGuideOpen(false)
        else if (event.key !== ' ' && event.key !== 'Backspace') return
        event.preventDefault()
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.repeat) return
      if (event.key === ' ') dispatch({ type: 'next', at: Date.now() })
      else if (event.key === 'Backspace') dispatch({ type: 'undo' })
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [guideOpen])

  useEffect(() => window.wildLearning?.onAdvance(() => dispatch({ type: 'next', at: Date.now() })), [])

  const here = current(session)
  const stage = useMemo(() => stageOf(session), [session])
  const label = stageLabel(stage)

  useEffect(() => window.wildLearning?.setStage(label, stage), [label, stage])

  return (
    <main className="group/widget fixed inset-0 flex flex-col overflow-hidden rounded-xl bg-stone-50 text-stone-600 dark:bg-stone-900 dark:text-stone-300">
      <header data-tauri-drag-region className="flex h-6 shrink-0 items-center gap-2 px-2.5 text-[11px] tabular-nums">
        <span className="truncate" data-testid="stats">
          {laps(session)}바퀴 · {label}
        </span>
        <div data-tauri-drag-region className="flex-1 self-stretch" />
        <button
          type="button"
          title="사용법 (?)"
          className="cursor-pointer rounded px-1 text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
          onClick={(event) => {
            event.currentTarget.blur()
            showGuide(() => setGuideOpen(true))
          }}
        >
          ?
        </button>
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
        <Board mode={here.mode} onJump={(mode) => dispatch({ type: 'jump', mode, at: Date.now() })} />
      </div>
      {window.wildLearning && <ResizeHandle />}
      {guideOpen && <GuideOverlay onClose={() => setGuideOpen(false)} />}
    </main>
  )
}
