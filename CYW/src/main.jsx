import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './components/panels/App.jsx'
import { WorldProvider } from './store/worldStore.jsx'
import { DragProvider } from './store/dragStore.jsx'
import { SelectionProvider } from './store/selectionStore.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DragProvider>
      <WorldProvider>
        <SelectionProvider>
          <App />
        </SelectionProvider>
      </WorldProvider>
    </DragProvider>
  </StrictMode>,
)
