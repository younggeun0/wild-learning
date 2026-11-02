import { listen } from '@tauri-apps/api/event'
import { LogicalSize, getCurrentWindow } from '@tauri-apps/api/window'

export type WildLearningBridge = {
  // 전역 단축키(src-tauri/src/main.rs)가 보내는 advance 이벤트. 구독 해제 함수를 돌려준다
  onAdvance(func: () => void): () => void
  resize(width: number, height: number): void
}

declare global {
  interface Window {
    wildLearning?: WildLearningBridge
    __TAURI_INTERNALS__?: unknown
  }
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
  }
}
