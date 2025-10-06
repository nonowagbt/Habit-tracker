import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

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
    <div className="card" style={{ maxWidth: 900, margin: '20px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <button onClick={logout}>Se déconnecter</button>
      </div>
      <nav style={{ marginBottom: 16 }}>
        <NavLink to="todo" style={{ marginRight: 8 }}>Todo list</NavLink>
        <NavLink to="steak" style={{ marginRight: 8 }}>Steak</NavLink>
        <NavLink to="parametre">Paramètre</NavLink>
      </nav>
      <Routes>
        <Route index element={<Navigate to="todo" replace />} />
        <Route path="todo" element={<TodoPage />} />
        <Route path="steak" element={<SteakPage />} />
        <Route path="parametre" element={<ParametrePage />} />
      </Routes>
    </div>
  )
}

function TodoPage() {
  return <div>Votre todo list</div>
}

function SteakPage() {
  return <div>Steak</div>
}

function ParametrePage() {
  return <div>Paramètre</div>
}

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
