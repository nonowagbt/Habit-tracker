import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import TodoPage from './pages/TodoPage.jsx'
import SteakPage from './pages/SteakPage.jsx'
import ParametrePage from './pages/ParametrePage.jsx'
import DashboardOverview from './pages/DashboardOverview.jsx'

function isAuthenticated() {
  return Boolean(localStorage.getItem('token'))
}

function Protected({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return children
}

const RECENT_EMAILS_KEY = 'recent_emails'
const REMEMBER_EMAIL_KEY = 'remembered_email'

function getRecentEmails() {
  try {
    const stored = localStorage.getItem(RECENT_EMAILS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentEmail(email) {
  if (!email) return
  try {
    const recent = getRecentEmails()
    const filtered = recent.filter(e => e.toLowerCase() !== email.toLowerCase())
    const updated = [email.toLowerCase(), ...filtered].slice(0, 5) // Garder max 5 emails
    localStorage.setItem(RECENT_EMAILS_KEY, JSON.stringify(updated))
  } catch {}
}

function getRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBER_EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

function setRememberedEmail(email) {
  try {
    if (email) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email)
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY)
    }
  } catch {}
}

function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState(() => getRememberedEmail())
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [googleClientId, setGoogleClientId] = useState(null)
  const [rememberEmail, setRememberEmail] = useState(!!getRememberedEmail())
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const [recentEmails, setRecentEmails] = useState(getRecentEmails())

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true })
    
    // Charger Google Identity Services
    const loadGoogleScript = () => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        // Script déjà chargé
        initializeGoogleSignIn()
        return
      }
      
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignIn
      document.head.appendChild(script)
    }

    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
        if (clientId) {
          setGoogleClientId(clientId)
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignIn,
          })
        }
      }
    }

    loadGoogleScript()
  }, [navigate])

  function handleGoogleButtonClick() {
    if (!googleClientId) {
      setMessage('Google Sign-In n\'est pas configuré. Veuillez configurer VITE_GOOGLE_CLIENT_ID dans les variables d\'environnement.')
      return
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      setMessage('Chargement de Google Sign-In en cours... Veuillez réessayer dans quelques instants.')
      return
    }

    try {
      // Créer un conteneur invisible pour le bouton Google
      let hiddenContainer = document.getElementById('hidden-google-button-container')
      if (!hiddenContainer) {
        hiddenContainer = document.createElement('div')
        hiddenContainer.id = 'hidden-google-button-container'
        hiddenContainer.style.position = 'absolute'
        hiddenContainer.style.left = '-9999px'
        hiddenContainer.style.opacity = '0'
        hiddenContainer.style.pointerEvents = 'none'
        document.body.appendChild(hiddenContainer)
        
        // Rendre le bouton Google dans le conteneur invisible
        window.google.accounts.id.renderButton(hiddenContainer, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 300,
        })
      }
      
      // Attendre que le bouton soit rendu puis déclencher son clic
      const triggerClick = () => {
        const googleButton = hiddenContainer.querySelector('div[role="button"]')
        if (googleButton) {
          googleButton.click()
        } else {
          // Réessayer après un court délai
          setTimeout(() => {
            const retryButton = hiddenContainer.querySelector('div[role="button"]')
            if (retryButton) {
              retryButton.click()
            } else {
              setMessage('Impossible de charger Google Sign-In. Veuillez réessayer.')
            }
          }, 300)
        }
      }
      
      setTimeout(triggerClick, 100)
    } catch (err) {
      console.error('Error triggering Google sign in:', err)
      setMessage('Erreur lors de la connexion Google. Veuillez réessayer.')
    }
  }

  function handleGoogleSignIn(response) {
    if (!response.credential) {
      setMessage('Erreur lors de la connexion Google')
      return
    }

    async function authenticateWithGoogle() {
      setMessage('')
      try {
        const res = await fetch('http://localhost:4000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        })
        const data = await res.json()
        if (!res.ok) {
          setMessage(data.error || 'Erreur de connexion Google')
          return
        }
        // Sauvegarder l'email dans les emails récents
        if (data.user?.email) {
          saveRecentEmail(data.user.email)
          setRecentEmails(getRecentEmails())
        }
        
        localStorage.setItem('token', data.token)
        if (data.user) {
          try { localStorage.setItem('user', JSON.stringify(data.user)) } catch {}
          try {
            if (!localStorage.getItem('userProfile')) {
              localStorage.setItem('userProfile', JSON.stringify({
                email: data.user.email || '',
                username: data.user.name || '',
                name: data.user.name || '',
                birthdate: '',
                phone: '',
                picture: data.user.picture || ''
              }))
            }
          } catch {}
        }
        navigate('/dashboard', { replace: true })
      } catch (err) {
        setMessage('Erreur de réseau')
      }
    }
    authenticateWithGoogle()
  }

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: mode === 'register' ? name : undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Erreur')
        return
      }
      
      // Sauvegarder l'email dans les emails récents
      if (email) {
        saveRecentEmail(email)
        setRecentEmails(getRecentEmails())
      }
      
      // Gérer "Se souvenir de moi"
      if (rememberEmail && email) {
        setRememberedEmail(email)
      } else {
        setRememberedEmail('')
      }
      
      localStorage.setItem('token', data.token)
      if (data.user) {
        try { localStorage.setItem('user', JSON.stringify(data.user)) } catch {}
        // initialize profile if absent
        try {
          if (!localStorage.getItem('userProfile')) {
            localStorage.setItem('userProfile', JSON.stringify({
              email: data.user.email || '',
              username: data.user.name || '',
              name: data.user.name || '',
              birthdate: '',
              phone: ''
            }))
          }
        } catch {}
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setMessage('Erreur de réseau')
    }
  }
  
  function handleEmailSelect(selectedEmail) {
    setEmail(selectedEmail)
    setShowEmailSuggestions(false)
  }
  
  function handleEmailChange(e) {
    const value = e.target.value
    setEmail(value)
    if (value && recentEmails.length > 0) {
      setShowEmailSuggestions(true)
    } else {
      setShowEmailSuggestions(false)
    }
  }
  
  const filteredEmails = recentEmails.filter(e => 
    e.toLowerCase().includes(email.toLowerCase()) && 
    e.toLowerCase() !== email.toLowerCase()
  )

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px' 
    }}>
      <div className="card-dark login-card" style={{ 
        maxWidth: 420, 
        width: '100%',
        padding: '24px'
      }}>
        <h1 className="brand" style={{ 
          fontSize: 'clamp(22px, 5vw, 28px)', 
          fontWeight: 700, 
          marginTop: 0, 
          marginBottom: 24,
          textAlign: 'center'
        }}>
          Habit Tracker
        </h1>
        
        <div className="login-tabs" style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          paddingBottom: 16
        }}>
          <button 
            onClick={() => setMode('login')} 
            className={mode === 'login' ? 'neon-btn' : 'nav-btn'}
            style={{ 
              flex: 1,
              border: mode === 'login' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.10)',
              color: mode === 'login' ? '#6ee7b7' : '#e5e7eb',
              background: mode === 'login' ? 'rgba(16,185,129,0.10)' : 'transparent'
            }}
          >
            Se connecter
          </button>
          <button 
            onClick={() => setMode('register')} 
            className={mode === 'register' ? 'neon-btn' : 'nav-btn'}
            style={{ 
              flex: 1,
              border: mode === 'register' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.10)',
              color: mode === 'register' ? '#6ee7b7' : '#e5e7eb',
              background: mode === 'register' ? 'rgba(16,185,129,0.10)' : 'transparent'
            }}
          >
            Créer un compte
          </button>
        </div>
        
        <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
          {mode === 'register' && (
            <div>
              <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                Nom
              </label>
              <input 
                className="input"
                value={name} 
                onChange={e=>setName(e.target.value)} 
                placeholder="Votre nom"
                required
              />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input 
              className="input"
              type="email" 
              value={email} 
              onChange={handleEmailChange}
              onFocus={() => {
                if (email && recentEmails.length > 0) {
                  setShowEmailSuggestions(true)
                }
              }}
              onBlur={() => {
                // Délai pour permettre le clic sur les suggestions
                setTimeout(() => setShowEmailSuggestions(false), 200)
              }}
              placeholder="vous@exemple.com" 
              required 
            />
            {showEmailSuggestions && filteredEmails.length > 0 && (
              <div className="email-suggestions" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                background: 'rgba(0,0,0,0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 8,
                padding: 4,
                zIndex: 1000,
                maxHeight: 200,
                overflowY: 'auto'
              }}>
                {filteredEmails.map((suggestedEmail, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleEmailSelect(suggestedEmail)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: '#e5e7eb',
                      cursor: 'pointer',
                      borderRadius: 6,
                      fontSize: 14,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.10)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent'
                    }}
                  >
                    {suggestedEmail}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              Mot de passe
            </label>
            <input 
              className="input"
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              placeholder="********" 
              required 
            />
          </div>
          {mode === 'login' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="remember-email"
                checked={rememberEmail}
                onChange={(e) => {
                  setRememberEmail(e.target.checked)
                  if (!e.target.checked) {
                    setRememberedEmail('')
                  }
                }}
                style={{
                  width: 16,
                  height: 16,
                  cursor: 'pointer'
                }}
              />
              <label 
                htmlFor="remember-email"
                className="muted"
                style={{ 
                  fontSize: 13, 
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Se souvenir de mon email
              </label>
            </div>
          )}
          <button 
            type="submit" 
            className="neon-btn"
            style={{ 
              width: '100%',
              padding: '12px',
              fontSize: 16,
              fontWeight: 600,
              marginTop: 8
            }}
          >
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </button>
        </form>

        <div style={{ marginTop: 20, marginBottom: 16 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 16,
            color: 'var(--text-secondary)',
            fontSize: 14
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }}></div>
            <span>ou</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }}></div>
          </div>
          <button
            type="button"
            onClick={handleGoogleButtonClick}
            className="google-signin-btn"
            disabled={!googleClientId}
            style={{
              opacity: googleClientId ? 1 : 0.6,
              cursor: googleClientId ? 'pointer' : 'not-allowed'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continuer avec Google</span>
          </button>
          {!googleClientId && (
            <p className="muted" style={{ 
              marginTop: 8, 
              fontSize: 12, 
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Configurez VITE_GOOGLE_CLIENT_ID pour activer la connexion Google
            </p>
          )}
        </div>
        
        {message && (
          <p className={message.includes('Erreur') ? 'danger' : 'accent'} style={{ 
            marginTop: 16, 
            marginBottom: 0,
            fontSize: 14,
            textAlign: 'center'
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

function DashboardLayout() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  function logout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }
  
  return (
    <div className="min-h-screen">
      <header className="header glass">
        <div className="container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '12px 16px',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'relative'
        }}>
          <h1 className="brand" style={{ margin: 0 }}>Habit Tracker</h1>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            flexWrap: 'nowrap'
          }}>
            {isMobile && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="neon-btn" 
                style={{ fontSize: 18, padding: '6px 10px' }}
                aria-label="Menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            )}
            <button 
              onClick={logout} 
              className="neon-btn" 
              style={{ 
                fontSize: 14,
                whiteSpace: 'nowrap'
              }}
            >
              {isMobile ? 'Déco' : 'Déconnexion'}
            </button>
          </div>
          <nav 
            className="nav" 
            style={{ 
              fontSize: 14,
              display: isMobile ? (mobileMenuOpen ? 'flex' : 'none') : 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto',
              gap: isMobile ? '4px' : '8px',
              position: isMobile ? 'absolute' : 'static',
              top: isMobile ? '100%' : 'auto',
              left: isMobile ? 0 : 'auto',
              right: isMobile ? 0 : 'auto',
              background: isMobile && mobileMenuOpen ? 'rgba(0,0,0,0.95)' : 'transparent',
              backdropFilter: isMobile && mobileMenuOpen ? 'blur(10px)' : 'none',
              borderTop: isMobile && mobileMenuOpen ? '1px solid rgba(255,255,255,0.10)' : 'none',
              padding: isMobile && mobileMenuOpen ? '12px 16px' : '0',
              zIndex: isMobile ? 100 : 'auto',
              marginTop: isMobile && mobileMenuOpen ? '12px' : '0'
            }}
          >
            <NavLink 
              to="/dashboard/overview" 
              className={({isActive}) => `nav-btn ${isActive ? 'nav-btn--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Vue d'ensemble
            </NavLink>
            <NavLink 
              to="/dashboard/todo" 
              className={({isActive}) => `nav-btn ${isActive ? 'nav-btn--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Todo list
            </NavLink>
            <NavLink 
              to="/dashboard/steak" 
              className={({isActive}) => `nav-btn ${isActive ? 'nav-btn--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Steak
            </NavLink>
            <NavLink 
              to="/dashboard/parametre" 
              className={({isActive}) => `nav-btn ${isActive ? 'nav-btn--active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Paramètre
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <Routes>
        <Route index element={<Navigate to="/dashboard/overview" replace />} />
        <Route path="overview" element={<DashboardOverview />} />
        <Route path="todo" element={<TodoPage />} />
        <Route path="steak" element={<SteakPage />} />
        <Route path="parametre" element={<ParametrePage />} />
        </Routes>
      </main>
    </div>
  )
}

// pages moved to client/src/pages/*.jsx

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard/*" element={<Protected><DashboardLayout /></Protected>} />
      <Route path="*" element={<div style={{ padding: 24 }}>Page non trouvée. <Link to="/">Retour</Link></div>} />
    </Routes>
  )
}
