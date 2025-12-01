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

function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard', { replace: true })
  }, [navigate])

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
          <div>
            <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input 
              className="input"
              type="email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              placeholder="vous@exemple.com" 
              required 
            />
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
