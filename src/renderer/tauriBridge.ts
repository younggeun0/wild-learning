import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { LogicalSize, getCurrentWindow } from '@tauri-apps/api/window'
import type { Stage } from './session'

export type WildLearningBridge = {
  // 전역 단축키(src-tauri/src/main.rs)가 보내는 advance 이벤트. 구독 해제 함수를 돌려준다
  onAdvance(func: () => void): () => void
  // 사용법 창을 열거나 이미 열린 창을 앞으로 가져온다
  openGuide(): void
  closeWindow(): void
  resize(width: number, height: number): void
  // 메뉴 막대 제목과 macOS 위젯
  setStage(label: string, stage: Stage): void
}

declare global {
  interface Window {
    wildLearning?: WildLearningBridge
    __TAURI_INTERNALS__?: unknown
  }
}

let latestStage = 0

// 메뉴 막대용 배지: 초록 바탕에 흰 글자. 2배 해상도로 그리면 macOS가 18pt 높이에 맞춰 줄인다
async function drawBadge(label: string): Promise<number[]> {
  await document.fonts.ready
  const scale = 2
  const height = 18 * scale
  const font = `600 ${12.5 * scale}px Pretendard, -apple-system, sans-serif`
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = font
  const padding = 7 * scale
  canvas.width = Math.ceil(ctx.measureText(label).width) + padding * 2
  canvas.height = height
  ctx.fillStyle = '#3a8f5c'
  ctx.beginPath()
  ctx.roundRect(0, 0, canvas.width, height, 5 * scale)
  ctx.fill()
  ctx.font = font
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, canvas.width / 2, height / 2 + scale)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('badge render failed')
  return Array.from(new Uint8Array(await blob.arrayBuffer()))
}

// 웹 빌드에서는 window.wildLearning이 없다
if (window.__TAURI_INTERNALS__) {
  window.wildLearning = {
    onAdvance(func) {
      const unlisten = listen('advance', () => func())
      return () => void unlisten.then((off) => off())
    },
    resize(width, height) {
      getCurrentWindow().setSize(new LogicalSize(width, height)).catch(console.error)
    },
    openGuide() {
      invoke('open_guide').catch(console.error)
    },
    closeWindow() {
      getCurrentWindow().close().catch(console.error)
    },
    setStage(label, stage) {
      const id = ++latestStage
      drawBadge(label)
        .then((badge) => {
          if (id === latestStage) return invoke('set_stage', { badge, stage })
        })
        .catch(console.error)
    },
  }
}
