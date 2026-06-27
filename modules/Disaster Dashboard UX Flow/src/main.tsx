/** Embedded in Resilience360: let parent shell background / video show through. */
if (typeof window !== 'undefined' && window.self !== window.top) {
  document.documentElement.classList.add('dd-portal-embedded')
}

import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(<App />)
  