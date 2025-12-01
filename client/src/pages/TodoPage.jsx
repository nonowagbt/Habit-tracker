import { useEffect, useMemo, useState } from 'react'

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

function writeLocalStorageJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function formatDateISO(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10)
}

export default function TodoPage() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    setTodos(readLocalStorageJSON(TODO_STORAGE_KEY, []))
  }, [])

  useEffect(() => {
    writeLocalStorageJSON(TODO_STORAGE_KEY, todos)
  }, [todos])

  const remaining = useMemo(() => todos.filter(t => !t.completed).length, [todos])

  function addTodo(e) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setTodos(prev => [
      { id: crypto.randomUUID(), title: trimmed, completed: false, createdAt: Date.now() },
      ...prev,
    ])
    setTitle('')
  }

  function toggleTodo(id) {
    const nowKey = formatDateISO(new Date())
    setTodos(prev => {
      const next = prev.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } : t)
      // If any todo is completed now, mark activity for today
      const anyCompletedToday = next.some(t => t.completed && t.completedAt && formatDateISO(new Date(t.completedAt)) === nowKey)
      if (anyCompletedToday) {
        const setDates = new Set(readLocalStorageJSON(ACTIVITY_STORAGE_KEY, []))
        setDates.add(nowKey)
        writeLocalStorageJSON(ACTIVITY_STORAGE_KEY, Array.from(setDates))
      }
      return next
    })
  }

  function removeTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  function clearCompleted() {
    setTodos(prev => prev.filter(t => !t.completed))
  }

  return (
    <div>
      <h3 className="accent" style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Votre todo list</h3>
      <form onSubmit={addTodo} className="todo-form" style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 12
      }}>
        <input 
          className="input" 
          value={title} 
          onChange={e=>setTitle(e.target.value)} 
          placeholder="Ajouter une tâche"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button 
          type="submit" 
          className="neon-btn todo-submit-btn"
          style={{ whiteSpace: 'nowrap' }}
        >
          Ajouter
        </button>
      </form>
      <div className="muted" style={{ fontSize: 14, marginBottom: 8 }}>Restantes: {remaining} / {todos.length}</div>
      {todos.length === 0 ? (
        <p className="muted">Aucune tâche pour le moment.</p>
      ) : (
        <ul style={{ display: 'grid', gap: 8, padding: 0, margin: 0, listStyle: 'none' }}>
          {todos.map(todo => (
            <li 
              key={todo.id} 
              className="card-dark" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '12px',
                flexWrap: 'wrap'
              }}
            >
              <input 
                style={{ width: 18, height: 18, flexShrink: 0 }} 
                type="checkbox" 
                checked={todo.completed} 
                onChange={() => toggleTodo(todo.id)} 
              />
              <span style={{ 
                textDecoration: todo.completed ? 'line-through' : 'none', 
                color: todo.completed ? '#9ca3af' : '#e5e7eb', 
                flex: 1,
                minWidth: 0,
                wordBreak: 'break-word'
              }}>
                {todo.title}
              </span>
              <button 
                style={{ fontSize: 13 }} 
                className="neon-link" 
                onClick={() => removeTodo(todo.id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 12 }}>
        <button 
          className="neon-btn todo-clear-btn" 
          onClick={clearCompleted} 
          disabled={!todos.some(t=>t.completed)}
        >
          Supprimer les terminées
        </button>
      </div>
    </div>
  )
}


