import { type Mode, STATIONS, station } from './session'

const GREEN = '#3a8f5c'
const AXIS = '#4b4b4b'
const CIRCLE = '#e2e2e2'
const PAPER = '#fafaf9'
const NODE_R = 17

const CYCLE = { x: 305, y: 192, r: 37 }

function cycleArc(fromDeg: number, toDeg: number) {
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return `${CYCLE.x + CYCLE.r * Math.cos(rad)} ${CYCLE.y + CYCLE.r * Math.sin(rad)}`
  }
  return `M ${point(fromDeg)} A ${CYCLE.r} ${CYCLE.r} 0 0 1 ${point(toDeg)}`
}

function Label({ x, y, lines, r, size }: { x: number; y: number; lines: string[]; r: number; size: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={CIRCLE} />
      <Lines x={x} y={y} lines={lines} size={size} fill="#333" />
    </g>
  )
}

function Lines({ x, y, lines, size, fill }: { x: number; y: number; lines: string[]; size: number; fill: string }) {
  const top = y - ((lines.length - 1) * size * 1.15) / 2
  return (
    <text x={x} textAnchor="middle" dominantBaseline="central" fontSize={size} fill={fill}>
      {lines.map((line, i) => (
        <tspan key={line} x={x} y={top + i * size * 1.15}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

export default function Board({ mode, onJump }: { mode: Mode; onJump: (mode: Mode) => void }) {
  const piece = station(mode)
  return (
    <svg viewBox="0 0 400 306" className="h-full w-full" role="img" aria-label="야생 학습의 네 가지 모드">
      <defs>
        <marker id="head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3" markerHeight="3" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill={GREEN} />
        </marker>
        <marker id="head-small" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill={GREEN} />
        </marker>
      </defs>

      <line x1={225} y1={22} x2={225} y2={248} stroke={AXIS} strokeWidth={2} />
      <line x1={48} y1={131} x2={392} y2={131} stroke={AXIS} strokeWidth={2} />
      <Label x={24} y={72} r={20} size={11} lines={['미래']} />
      <Label x={24} y={192} r={20} size={9} lines={['과거·', '현재']} />
      <Label x={136} y={270} r={18} size={11} lines={['분산']} />
      <Label x={308} y={270} r={18} size={11} lines={['집중']} />

      <g fill="none" stroke={GREEN} strokeLinecap="round">
        <line x1={160} y1={70} x2={285} y2={70} strokeWidth={7} />
        <line x1={160} y1={192} x2={268} y2={192} strokeWidth={7} />
        <line x1={303} y1={70} x2={334} y2={70} strokeWidth={6} markerEnd="url(#head)" />
        <line x1={142} y1={192} x2={120} y2={192} strokeWidth={6} markerEnd="url(#head)" />
        <path d="M 368 92 C 396 124 394 164 360 184" strokeWidth={4} markerEnd="url(#head-small)" />
        <path d="M 78 172 C 58 126 84 74 134 64" strokeWidth={4} markerEnd="url(#head-small)" />
        <g strokeWidth={2.5} markerEnd="url(#head-small)">
          <path d={cycleArc(207, 286)} />
          <path d={cycleArc(342, 376)} />
          <path d={cycleArc(74, 150)} />
        </g>
      </g>
      <Lines x={366} y={70} size={9} fill="#444" lines={['멘탈', '시뮬레이션']} />
      <Lines x={82} y={192} size={9} fill="#444" lines={['멘탈', '레프리젠테이션']} />

      {STATIONS.map((st) => (
        <circle key={st.mode} cx={st.x} cy={st.y} r={NODE_R} fill={PAPER} />
      ))}
      <circle
        r={NODE_R + 2}
        fill="#f4b740"
        style={{ transform: `translate(${piece.x}px, ${piece.y}px)`, transition: 'transform 450ms ease-in-out' }}
        data-testid="piece"
      />
      {STATIONS.map((st) => (
        <g key={st.mode} className="cursor-pointer" onClick={() => onJump(st.mode)} data-mode={st.mode}>
          <circle cx={st.x} cy={st.y} r={NODE_R} fill="transparent" />
          <Lines x={st.x} y={st.y} size={14} fill="#1c1917" lines={[st.label]} />
        </g>
      ))}

      <Lines x={225} y={298} size={11} fill="#777" lines={['야생 학습의 네 가지 모드']} />
    </svg>
  )
}
