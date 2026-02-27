import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './components/panels/App.jsx'
import { WorldProvider } from './store/worldStore.jsx'
import { DragProvider } from './store/dragStore.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DragProvider>
      <WorldProvider>
        <App />
      </WorldProvider>
    </DragProvider>
  </StrictMode>,
)
