import { createRoot } from 'react-dom/client'
import App from './App'
import { isGuideWindow } from './desktop'
import { GuidePage } from './Guide'

createRoot(document.getElementById('root') as HTMLElement).render(isGuideWindow() ? <GuidePage /> : <App />)
