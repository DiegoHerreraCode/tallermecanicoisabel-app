import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { TallerMecanicoIsabelApp } from './TallerMecanicoIsabelApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TallerMecanicoIsabelApp />
  </StrictMode>,
)