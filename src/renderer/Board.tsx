import { Fragment } from 'react'
import {
  COLS,
  type Mode,
  QUADRANTS,
  type Quadrant,
  ROWS,
  STATIONS,
  type Station,
  nextStation,
  station,
} from './session'

type JumpProps = { here: Station; onJump: (mode: Mode) => void }

function Cell({ quadrant, here, onJump }: JumpProps & { quadrant: Quadrant }) {
  const { label, row, col } = QUADRANTS[quadrant]
  const active = here.quadrant === quadrant
  const steps = STATIONS.filter((st) => st.quadrant === quadrant)
  return (
    <div
      data-quadrant={quadrant}
      onClick={() => onJump(active ? here.mode : steps[0].mode)}
      style={{ gridRow: ROWS.indexOf(row) + 1, gridColumn: COLS.indexOf(col) + 2 }}
      className={`flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg transition-colors duration-300 ${
        active ? 'bg-accent text-white' : 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500'
      }`}
    >
      <span
        className={
          active
            ? 'text-[clamp(20px,14vmin,64px)] leading-none font-bold'
            : 'text-[clamp(12px,5vmin,26px)] leading-tight font-semibold'
        }
      >
        {active ? here.label : label}
      </span>
      {steps.length > 1 && (
        <span className="flex gap-1 text-[clamp(9px,3vmin,13px)]">
          {steps.map((st, i) => (
            <Fragment key={st.mode}>
              {i > 0 && <span className="opacity-60">·</span>}
              <span
                data-mode={st.mode}
                onClick={(event) => {
                  event.stopPropagation()
                  onJump(st.mode)
                }}
                className={st.mode === here.mode ? 'font-bold underline underline-offset-2' : 'opacity-70'}
              >
                {st.label}
              </span>
            </Fragment>
          ))}
        </span>
      )}
    </div>
  )
}

function Grid({ here, onJump }: JumpProps) {
  const axis = 'flex items-center justify-center text-[10px] text-stone-400 dark:text-stone-500'
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[14px_1fr_1fr] grid-rows-[1fr_1fr_14px] gap-1 compact:hidden">
      {ROWS.map((row, i) => (
        <span
          key={row}
          style={{ gridRow: i + 1, gridColumn: 1 }}
          className={`${axis} tracking-[-2px] [text-orientation:upright] [writing-mode:vertical-rl]`}
        >
          {row}
        </span>
      ))}
      {COLS.map((col, i) => (
        <span key={col} style={{ gridRow: 3, gridColumn: i + 2 }} className={axis}>
          {col}
        </span>
      ))}
      {(Object.keys(QUADRANTS) as Quadrant[]).map((q) => (
        <Cell key={q} quadrant={q} here={here} onJump={onJump} />
      ))}
    </div>
  )
}

function Strip({ here, onJump }: JumpProps) {
  const reached = STATIONS.indexOf(here)
  return (
    <div className="hidden min-h-0 flex-1 items-center px-1.5 compact:flex">
      <div className="flex w-full items-end gap-1">
        {STATIONS.map((st, i) => {
          const on = st === here
          return (
            <div
              key={st.mode}
              data-mode={st.mode}
              onClick={() => onJump(st.mode)}
              className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1"
            >
              <div
                className={`rounded-full transition-all duration-300 ${
                  on ? 'h-3.5 bg-accent' : i < reached ? 'h-2 bg-accent/35' : 'h-2 bg-stone-200 dark:bg-stone-700'
                }`}
              />
              <span
                className={`text-center text-[11px] leading-none ${
                  on ? 'font-bold text-stone-800 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'
                }`}
              >
                {st.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Board({ mode, onJump }: { mode: Mode; onJump: (mode: Mode) => void }) {
  const here = station(mode)
  return (
    <div className="flex h-full flex-col gap-1">
      <Grid here={here} onJump={onJump} />
      <Strip here={here} onJump={onJump} />
      <p className="shrink-0 text-center text-[11px] leading-none text-stone-400 dark:text-stone-500">
        Space → <b className="font-semibold text-stone-700 dark:text-stone-200">{nextStation(mode).label}</b>
      </p>
    </div>
  )
}
