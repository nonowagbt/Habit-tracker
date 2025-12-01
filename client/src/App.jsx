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
    <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>Habit Tracker</h1>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setMode('login')} disabled={mode==='login'}>Se connecter</button>
        <button onClick={() => setMode('register')} disabled={mode==='register'} style={{ marginLeft: 8 }}>Créer un compte</button>
      </div>
      <form onSubmit={submit}>
        {mode === 'register' && (
          <div style={{ marginBottom: 8 }}>
            <label>Nom</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Votre nom" />
          </div>
        )}
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Mot de passe</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="********" required />
        </div>
        <button type="submit">{mode === 'login' ? 'Connexion' : 'Inscription'}</button>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  )
}

function DashboardLayout() {
  const navigate = useNavigate()
  function logout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }
  return (
    <div className="min-h-screen">
      <header className="header glass">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <h1 className="brand">Habit Tracker</h1>
          <nav className="nav" style={{ fontSize: 14 }}>
            <NavLink to="/dashboard/overview" className={({isActive}) => `nav-btn ${isActive ? 'nav-btn--active' : ''}`}>Vue d'ensemble</NavLink>
            <NavLink to="/dashboard/todo" className={({isActive}) => `nav-btn ${isActive ? 'nav-btn--active' : ''}`}>Todo list</NavLink>
            <NavLink to="/dashboard/steak" className={({isActive}) => `nav-btn ${isActive ? 'nav-btn--active' : ''}`}>Steak</NavLink>
            <NavLink to="/dashboard/parametre" className={({isActive}) => `nav-btn ${isActive ? 'nav-btn--active' : ''}`}>Paramètre</NavLink>
          </nav>
          <button onClick={logout} className="neon-btn" style={{ fontSize: 14 }}>Se déconnecter</button>
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
