import { type PointerEvent, useRef } from 'react'
import { resizeWindow } from './desktop'

// 테두리 없는 투명 창은 OS 가장자리로 크기를 바꿀 수 없다. 둥근 모서리에 잘리지 않게 안쪽으로 띄운다
export default function ResizeHandle() {
  const startRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    startRef.current = { x: event.screenX, y: event.screenY, width: window.innerWidth, height: window.innerHeight }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = startRef.current
    if (!start) return
    resizeWindow(start.width + event.screenX - start.x, start.height + event.screenY - start.y)
  }

  const onPointerUp = () => {
    startRef.current = null
  }

  return (
    <div
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="absolute right-1 bottom-1 h-3 w-3 cursor-nwse-resize opacity-0 transition-opacity group-hover/widget:opacity-100"
    >
      <span className="absolute right-0.5 bottom-0.5 h-2 w-2 rounded-br-sm border-r-2 border-b-2 border-stone-400 dark:border-stone-500" />
    </div>
  )
}
