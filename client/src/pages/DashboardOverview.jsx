import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const TODO_STORAGE_KEY = 'todos'
const ACTIVITY_STORAGE_KEY = 'activityDates'

function readLocalStorageJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function formatDateISO(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10)
}

function computeCurrentStreak(activityDatesSet) {
  let streak = 0
  const today = new Date()
  for (let i = 0; ; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = formatDateISO(d)
    if (activityDatesSet.has(key)) streak++
    else break
  }
  return streak
}

export default function DashboardOverview() {
  const [todos, setTodos] = useState([])
  const [activityDates, setActivityDates] = useState(new Set())

  useEffect(() => {
    setTodos(readLocalStorageJSON(TODO_STORAGE_KEY, []))
    const dates = readLocalStorageJSON(ACTIVITY_STORAGE_KEY, [])
    setActivityDates(new Set(Array.isArray(dates) ? dates : []))
  }, [])

  const pendingTodos = useMemo(() => todos.filter(t => !t.completed).slice(0, 3), [todos])
  const completedToday = useMemo(() => activityDates.has(formatDateISO(new Date())), [activityDates])
  const streak = useMemo(() => computeCurrentStreak(activityDates), [activityDates])

  return (
    <div>
      <h3 className="accent" style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Vue d'ensemble</h3>
      <div className="two-col">
        <section className="card-dark card-accent-left">
          <h4 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>To‑do (aperçu)</h4>
          {pendingTodos.length === 0 ? (
            <p className="muted">Aucune tâche en attente.</p>
          ) : (
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {pendingTodos.map(t => (
                <li key={t.id}>{t.title}</li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: 12 }}>
            <Link className="neon-link" to="/dashboard/todo">Voir la todo list</Link>
          </div>
        </section>

        <section className="card-dark card-accent-right">
          <h4 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Streak (jours d'activité)</h4>
          <div className="accent" style={{ fontSize: 28, fontWeight: 700 }}>{streak}</div>
          <div className={completedToday ? 'accent' : 'muted'} style={{ marginTop: 4 }}>
            {completedToday ? 'Objectif du jour atteint ✅' : "Pas encore d'activité aujourd'hui"}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="neon-link" to="/dashboard/steak">Voir le détail</Link>
          </div>
        </section>
      </div>
    </div>
  )
}

 