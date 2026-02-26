import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './components/App.jsx'
import { GibbetProvider } from './store/gibbetStore.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GibbetProvider>
      <App />
    </GibbetProvider>
  </StrictMode>,
)
