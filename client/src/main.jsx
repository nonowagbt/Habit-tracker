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

// PWA: Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// PWA: Handle install prompt
let deferredPrompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  // Vous pouvez afficher un bouton "Installer l'app" ici
  console.log('PWA install prompt available')
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
