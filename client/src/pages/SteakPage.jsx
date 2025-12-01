import { useEffect, useMemo, useState } from 'react'

const ACTIVITY_STORAGE_KEY = 'activityDates'

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

function generateCalendar(rangeDays = 21) {
  const days = []
  const today = new Date()
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d)
  }
  return days
}

export default function SteakPage() {
  const [activityDates, setActivityDates] = useState(new Set())

  useEffect(() => {
    const arr = readLocalStorageJSON(ACTIVITY_STORAGE_KEY, [])
    setActivityDates(new Set(Array.isArray(arr) ? arr : []))
  }, [])

  const streak = useMemo(() => computeCurrentStreak(activityDates), [activityDates])
  const days = useMemo(() => generateCalendar(28), [])

  function toggleDay(date) {
    const key = formatDateISO(date)
    setActivityDates(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      writeLocalStorageJSON(ACTIVITY_STORAGE_KEY, Array.from(next))
      return next
    })
  }

  return (
    <div>
      <h3 className="accent" style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Streak</h3>
      <div className="muted" style={{ marginBottom: 8 }}>Série actuelle: <strong className="accent">{streak}</strong> jour(s)</div>
      <div className="card-dark" style={{ 
        display: 'inline-block',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'auto'
      }}>
        <div className="streak-calendar" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(14, minmax(20px, 1fr))', 
          gap: 6,
          minWidth: 'fit-content',
          width: '100%',
          maxWidth: '100%'
        }}>
          {days.map(d => {
            const key = formatDateISO(d)
            const active = activityDates.has(key)
            return (
              <button 
                key={key} 
                onClick={() => toggleDay(d)} 
                title={key} 
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  minWidth: 20,
                  maxWidth: 24,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: active ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.10)',
                  background: active ? '#059669' : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }} 
              />
            )
          })}
        </div>
      </div>
      <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>Cliquez pour marquer vos jours d'activité. Compléter une tâche dans la todo ajoute automatiquement l'activité du jour.</p>
    </div>
  )
}


