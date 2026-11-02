import './tauriBridge'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GuidePage } from './Guide'

createRoot(document.getElementById('root') as HTMLElement).render(
  window.__TAURI_INTERNALS__ && getCurrentWindow().label === 'guide' ? <GuidePage /> : <App />,
)
