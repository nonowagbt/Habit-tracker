import { useEffect, useState } from 'react'
const TODO_STORAGE_KEY = 'todos'
const ACTIVITY_STORAGE_KEY = 'activityDates'
const PROFILE_PHOTO_KEY = 'profilePhoto'
const USER_PROFILE_KEY = 'userProfile'
const THEME_KEY = 'app_theme'

function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'dark'
  } catch {
    return 'dark'
  }
}

function applyTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
  } catch {}
}

function readLocalStorageJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocalStorageJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export default function ParametrePage() {
  const [photo, setPhoto] = useState(() => {
    try {
      return localStorage.getItem(PROFILE_PHOTO_KEY) || ''
    } catch {
      return ''
    }
  })
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}') } catch { return {} }
  })
  const [theme, setTheme] = useState(() => getTheme())

  useEffect(() => {
    try { localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile)) } catch {}
  }, [profile])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  function onPhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || '')
      setPhoto(url)
      try { localStorage.setItem(PROFILE_PHOTO_KEY, url) } catch {}
    }
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setPhoto('')
    try { localStorage.removeItem(PROFILE_PHOTO_KEY) } catch {}
  }
  function exportData() {
    const data = {
      todos: readLocalStorageJSON(TODO_STORAGE_KEY, []),
      activityDates: readLocalStorageJSON(ACTIVITY_STORAGE_KEY, []),
      exportedAt: new Date().toISOString(),
      version: 1,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'habit-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function onImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        if (Array.isArray(parsed.todos)) writeLocalStorageJSON(TODO_STORAGE_KEY, parsed.todos)
        if (Array.isArray(parsed.activityDates)) writeLocalStorageJSON(ACTIVITY_STORAGE_KEY, parsed.activityDates)
        alert('Import réussi. Actualisez la page pour voir les changements.')
      } catch {
        alert('Fichier invalide')
      }
    }
    reader.readAsText(file)
  }

  function resetTodos() {
    if (confirm('Supprimer toutes les tâches ?')) {
      writeLocalStorageJSON(TODO_STORAGE_KEY, [])
      alert('Todos réinitialisés')
    }
  }

  function resetStreak() {
    if (confirm('Réinitialiser le streak ?')) {
      writeLocalStorageJSON(ACTIVITY_STORAGE_KEY, [])
      alert('Streak réinitialisé')
    }
  }

  function toggleBackgroundBoost() {
    const has = document.body.classList.toggle('bg-boost')
    if (has) {
      document.body.style.backgroundImage =
        'radial-gradient(ellipse at 15% -10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(ellipse at 85% 110%, rgba(59,130,246,0.18), transparent 60%)'
    } else {
      document.body.style.backgroundImage =
        'radial-gradient(ellipse at 20% -10%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(ellipse at 80% 110%, rgba(59,130,246,0.10), transparent 60%)'
    }
  }

  return (
    <div>
      <h3 className="accent" style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Paramètre</h3>

      <section className="card-dark" style={{ marginBottom: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 8 }}>Informations du compte</h4>
        <div className="profile-grid" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Email</label>
            <input className="input" type="email" value={profile.email || ''} onChange={e=>setProfile(p=>({ ...p, email: e.target.value }))} placeholder="vous@exemple.com" />
          </div>
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Username</label>
            <input className="input" value={profile.username || ''} onChange={e=>setProfile(p=>({ ...p, username: e.target.value }))} placeholder="votre pseudo" />
          </div>
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Nom</label>
            <input className="input" value={profile.name || ''} onChange={e=>setProfile(p=>({ ...p, name: e.target.value }))} placeholder="Votre nom" />
          </div>
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Date de naissance</label>
            <input className="input" type="date" value={profile.birthdate || ''} onChange={e=>setProfile(p=>({ ...p, birthdate: e.target.value }))} />
          </div>
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Téléphone</label>
            <input className="input" type="tel" value={profile.phone || ''} onChange={e=>setProfile(p=>({ ...p, phone: e.target.value }))} placeholder="06 12 34 56 78" />
          </div>
        </div>
      </section>

      <section className="card-dark" style={{ marginBottom: 16, textAlign: 'center' }}>
        <h4 style={{ marginTop: 0, marginBottom: 8 }}>Profil</h4>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', display: 'grid', placeItems: 'center' }}>
            {photo ? (
              <img src={photo} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span className="muted" style={{ fontSize: 12 }}>Aucune photo</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <label className="neon-btn" style={{ cursor: 'pointer' }}>
              Changer la photo
              <input onChange={onPhotoChange} type="file" accept="image/*" style={{ display: 'none' }} />
            </label>
            <button className="neon-btn" onClick={removePhoto} disabled={!photo}>Retirer</button>
          </div>
        </div>
      </section>

      <section className="card-dark" style={{ marginBottom: 16, textAlign: 'center' }}>
        <h4 style={{ marginTop: 0, marginBottom: 8 }}>Données</h4>
        <div className="data-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <button className="neon-btn" onClick={exportData} style={{ flex: '1 1 auto', minWidth: '120px' }}>Exporter</button>
          <label className="neon-btn" style={{ display: 'inline-block', cursor: 'pointer', flex: '1 1 auto', minWidth: '120px' }}>
            Importer
            <input onChange={onImportFile} type="file" accept="application/json" style={{ display: 'none' }} />
          </label>
          <button className="neon-btn" onClick={resetTodos} style={{ flex: '1 1 auto', minWidth: '120px' }}>Réinitialiser todos</button>
          <button className="neon-btn" onClick={resetStreak} style={{ flex: '1 1 auto', minWidth: '120px' }}>Réinitialiser streak</button>
        </div>
      </section>

      <section className="card-dark">
        <h4 style={{ marginTop: 0, marginBottom: 12 }}>Apparence</h4>
        <div className="theme-toggle" style={{ marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Thème</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              {theme === 'dark' ? 'Sombre' : 'Clair'}
            </div>
          </div>
          <div 
            className="theme-toggle-switch"
            onClick={toggleTheme}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleTheme()
              }
            }}
            aria-label={`Basculer vers le thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
          />
        </div>
        <button className="neon-btn" onClick={toggleBackgroundBoost}>Accentuer l'arrière‑plan</button>
      </section>

      <section className="card-dark" style={{ marginTop: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 8 }}>Application mobile</h4>
        <PWAInstallPrompt />
      </section>

      <section className="card-dark" style={{ marginTop: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 8 }}>Notifications par email</h4>
        <EmailNotificationsSettings />
      </section>

      <section className="card-dark" style={{ marginTop: 16 }}>
        <h4 style={{ marginTop: 0, marginBottom: 8 }}>Sécurité</h4>
        <ChangePasswordForm />
      </section>
    </div>
  )
}

function PWAInstallPrompt() {
  const [installable, setInstallable] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setInstalled(true)
      return
    }

    // Écouter l'événement beforeinstallprompt
    const handler = (e) => {
      e.preventDefault()
      window.deferredPrompt = e
      setInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function handleInstall() {
    if (!window.deferredPrompt) {
      return
    }

    window.deferredPrompt.prompt()
    const { outcome } = await window.deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setInstallable(false)
      setInstalled(true)
    }
    
    window.deferredPrompt = null
  }

  if (installed) {
    return (
      <div className="muted" style={{ fontSize: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 6 }}>
        ✅ Application installée ! Vous pouvez l'utiliser hors ligne.
      </div>
    )
  }

  if (!installable) {
    return (
      <div className="muted" style={{ fontSize: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 6 }}>
        <div style={{ marginBottom: 8 }}>📱 Installez l'application sur votre appareil mobile :</div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
          <li><strong>iOS:</strong> Appuyez sur le bouton Partager, puis "Sur l'écran d'accueil"</li>
          <li><strong>Android:</strong> Menu du navigateur → "Ajouter à l'écran d'accueil"</li>
        </ul>
      </div>
    )
  }

  return (
    <div>
      <div className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
        Installez l'application pour une meilleure expérience mobile et un accès hors ligne.
      </div>
      <button className="neon-btn" onClick={handleInstall} style={{ width: '100%' }}>
        📱 Installer l'application
      </button>
    </div>
  )
}

function EmailNotificationsSettings() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem('emailNotificationsEnabled') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('emailNotificationsEnabled', enabled.toString())
    } catch {}
  }, [enabled])

  async function testEmail() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Vous devez être connecté pour tester l\'envoi d\'email')
        return
      }

      const res = await fetch('http://localhost:4000/api/todos/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (res.ok) {
        alert('Email de test envoyé avec succès ! Vérifiez votre boîte de réception.')
      } else {
        alert(data.error || 'Erreur lors de l\'envoi de l\'email')
      }
    } catch (err) {
      alert('Erreur de connexion au serveur')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Activer les rappels par email</div>
          <div className="muted" style={{ fontSize: 12 }}>
            Recevez un email quotidien si vous avez des tâches non complétées
          </div>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 28 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span className="theme-toggle-switch" style={{ cursor: 'pointer' }} />
        </label>
      </div>
      
      <div className="muted" style={{ fontSize: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 6 }}>
        <strong>Note :</strong> Les notifications sont envoyées automatiquement tous les jours à 9h (heure configurée côté serveur). 
        Assurez-vous que votre email est correctement configuré dans les paramètres du compte.
      </div>

      <button 
        className="neon-btn" 
        onClick={testEmail}
        style={{ width: '100%' }}
      >
        Envoyer un email de test
      </button>
    </div>
  )
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmNext, setConfirmNext] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    if (!next || next.length < 6) {
      setMsg('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (next !== confirmNext) {
      setMsg('Les mots de passe ne correspondent pas.')
      return
    }
    // Pas d’API de changement de mot de passe pour l’instant -> mock
    setMsg('Mot de passe mis à jour (démo).')
    setCurrent(''); setNext(''); setConfirmNext('')
  }

  return (
    <form onSubmit={submit} className="password-form" style={{ display: 'grid', gap: 8, maxWidth: 520, width: '100%' }}>
      <div>
        <label className="muted" style={{ fontSize: 12 }}>Mot de passe actuel</label>
        <input className="input" type="password" value={current} onChange={e=>setCurrent(e.target.value)} placeholder="••••••••" />
      </div>
      <div>
        <label className="muted" style={{ fontSize: 12 }}>Nouveau mot de passe</label>
        <input className="input" type="password" value={next} onChange={e=>setNext(e.target.value)} placeholder="••••••••" />
      </div>
      <div>
        <label className="muted" style={{ fontSize: 12 }}>Confirmer le mot de passe</label>
        <input className="input" type="password" value={confirmNext} onChange={e=>setConfirmNext(e.target.value)} placeholder="••••••••" />
      </div>
      <div className="password-form-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="neon-btn" type="submit" style={{ flex: '0 0 auto' }}>Mettre à jour</button>
        {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
      </div>
    </form>
  )
}


