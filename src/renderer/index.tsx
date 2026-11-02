import './tauriBridge'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GuidePage } from './Guide'

createRoot(document.getElementById('root') as HTMLElement).render(
  new URLSearchParams(location.search).get('view') === 'guide' ? <GuidePage /> : <App />,
)
