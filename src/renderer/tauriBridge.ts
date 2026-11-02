import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { LogicalSize, getCurrentWindow } from '@tauri-apps/api/window'

export type WildLearningBridge = {
  // 전역 단축키(src-tauri/src/main.rs)가 보내는 advance 이벤트. 구독 해제 함수를 돌려준다
  onAdvance(func: () => void): () => void
  // 사용법 창을 열거나 이미 열린 창을 앞으로 가져온다
  openGuide(): void
  closeWindow(): void
  resize(width: number, height: number): void
  // 메뉴 막대 제목. since는 epoch ms이고 경과 시간은 Rust가 매초 센다
  setTrayStage(label: string, since: number): void
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
    openGuide() {
      invoke('open_guide').catch(console.error)
    },
    closeWindow() {
      getCurrentWindow().close().catch(console.error)
    },
    setTrayStage(label, since) {
      invoke('set_tray_stage', { label, since }).catch(console.error)
    },
  }
}
