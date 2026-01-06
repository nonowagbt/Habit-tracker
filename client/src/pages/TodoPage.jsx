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
  const [loading, setLoading] = useState(true)

  // Charger les todos depuis la DB au démarrage
  useEffect(() => {
    loadTodosFromServer()
  }, [])

  // Sauvegarder dans localStorage comme backup quand les todos changent
  useEffect(() => {
    if (!loading && todos.length >= 0) {
      writeLocalStorageJSON(TODO_STORAGE_KEY, todos)
    }
  }, [todos, loading])

  async function loadTodosFromServer() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        // Si pas de token, charger depuis localStorage en fallback
        setTodos(readLocalStorageJSON(TODO_STORAGE_KEY, []))
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:4000/api/todos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Convertir les todos de la DB au format attendu
        const formattedTodos = data.todos.map(t => ({
          id: t._id || t.id,
          title: t.title,
          completed: t.completed || false,
          completedAt: t.completedAt ? new Date(t.completedAt).getTime() : undefined,
          createdAt: t.createdAt ? new Date(t.createdAt).getTime() : Date.now()
        }))
        setTodos(formattedTodos)
        // Sauvegarder aussi dans localStorage comme backup
        writeLocalStorageJSON(TODO_STORAGE_KEY, formattedTodos)
      } else {
        // Fallback sur localStorage si erreur
        setTodos(readLocalStorageJSON(TODO_STORAGE_KEY, []))
      }
    } catch (err) {
      console.error('Failed to load todos:', err)
      // Fallback sur localStorage
      setTodos(readLocalStorageJSON(TODO_STORAGE_KEY, []))
    } finally {
      setLoading(false)
    }
  }

  const remaining = useMemo(() => todos.filter(t => !t.completed).length, [todos])

  async function addTodo(e) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    const token = localStorage.getItem('token')
    if (!token) {
      // Fallback localStorage si pas de token
      const newTodo = { id: crypto.randomUUID(), title: trimmed, completed: false, createdAt: Date.now() }
      setTodos(prev => [newTodo, ...prev])
      setTitle('')
      return
    }

    try {
      const response = await fetch('http://localhost:4000/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: trimmed })
      })

      if (response.ok) {
        const data = await response.json()
        const newTodo = {
          id: data.todo._id || data.todo.id,
          title: data.todo.title,
          completed: data.todo.completed || false,
          createdAt: data.todo.createdAt ? new Date(data.todo.createdAt).getTime() : Date.now()
        }
        setTodos(prev => [newTodo, ...prev])
        setTitle('')
      } else {
        console.error('Failed to create todo')
        // Fallback: créer localement
        const newTodo = { id: crypto.randomUUID(), title: trimmed, completed: false, createdAt: Date.now() }
        setTodos(prev => [newTodo, ...prev])
        setTitle('')
      }
    } catch (err) {
      console.error('Failed to create todo:', err)
      // Fallback: créer localement
      const newTodo = { id: crypto.randomUUID(), title: trimmed, completed: false, createdAt: Date.now() }
      setTodos(prev => [newTodo, ...prev])
      setTitle('')
    }
  }

  async function toggleTodo(id) {
    const token = localStorage.getItem('token')
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    const newCompleted = !todo.completed
    const nowKey = formatDateISO(new Date())

    // Mettre à jour l'état local immédiatement pour l'UX
    setTodos(prev => {
      const next = prev.map(t => 
        t.id === id 
          ? { ...t, completed: newCompleted, completedAt: newCompleted ? Date.now() : undefined } 
          : t
      )
      // If any todo is completed now, mark activity for today
      const anyCompletedToday = next.some(t => t.completed && t.completedAt && formatDateISO(new Date(t.completedAt)) === nowKey)
      if (anyCompletedToday) {
        const setDates = new Set(readLocalStorageJSON(ACTIVITY_STORAGE_KEY, []))
        setDates.add(nowKey)
        writeLocalStorageJSON(ACTIVITY_STORAGE_KEY, Array.from(setDates))
      }
      return next
    })

    // Sauvegarder en DB
    if (token) {
      try {
        const response = await fetch(`http://localhost:4000/api/todos/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            completed: newCompleted,
            title: todo.title // Inclure le title au cas où le todo n'existe pas encore en DB
          })
        })

        if (response.ok) {
          const data = await response.json()
          // Mettre à jour avec les données de la DB
          setTodos(prev => prev.map(t => 
            t.id === id 
              ? {
                  ...t,
                  completed: data.todo.completed,
                  completedAt: data.todo.completedAt ? new Date(data.todo.completedAt).getTime() : undefined
                }
              : t
          ))
        } else {
          console.error('Failed to update todo')
          // Revert si erreur
          setTodos(prev => prev.map(t => 
            t.id === id ? { ...t, completed: !newCompleted, completedAt: undefined } : t
          ))
        }
      } catch (err) {
        console.error('Failed to update todo:', err)
        // Revert si erreur
        setTodos(prev => prev.map(t => 
          t.id === id ? { ...t, completed: !newCompleted, completedAt: undefined } : t
        ))
      }
    }
  }

  async function removeTodo(id) {
    const token = localStorage.getItem('token')
    
    // Supprimer de l'état local immédiatement
    setTodos(prev => prev.filter(t => t.id !== id))

    // Supprimer de la DB
    if (token) {
      try {
        await fetch(`http://localhost:4000/api/todos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (err) {
        console.error('Failed to delete todo:', err)
        // Recharger depuis la DB en cas d'erreur
        loadTodosFromServer()
      }
    }
  }

  async function clearCompleted() {
    const token = localStorage.getItem('token')
    const completedTodos = todos.filter(t => t.completed)
    
    // Supprimer de l'état local immédiatement
    setTodos(prev => prev.filter(t => !t.completed))

    // Supprimer de la DB
    if (token && completedTodos.length > 0) {
      try {
        await Promise.all(
          completedTodos.map(todo => 
            fetch(`http://localhost:4000/api/todos/${todo.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
          )
        )
      } catch (err) {
        console.error('Failed to delete completed todos:', err)
        // Recharger depuis la DB en cas d'erreur
        loadTodosFromServer()
      }
    }
  }

  if (loading) {
    return (
      <div>
        <h3 className="accent" style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Votre todo list</h3>
        <p className="muted">Chargement...</p>
      </div>
    )
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


