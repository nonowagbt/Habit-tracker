import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Appliquer le thème au chargement
const savedTheme = localStorage.getItem('app_theme') || 'dark'
if (savedTheme === 'light') {
  document.body.classList.add('light-theme')
} else {
  document.body.classList.remove('light-theme')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
