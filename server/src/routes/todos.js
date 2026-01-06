import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Todo from '../models/Todo.js';
import User from '../models/User.js';

const router = Router();

function getUserIdFromToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const decoded = jwt.verify(token, secret);
    return decoded.sub;
  } catch {
    return null;
  }
}

// Synchroniser les todos depuis le client
router.post('/sync', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { todos } = req.body;
    if (!Array.isArray(todos)) {
      return res.status(400).json({ error: 'todos must be an array' });
    }

    // Supprimer les anciens todos de l'utilisateur
    await Todo.deleteMany({ userId });

    // Créer les nouveaux todos
    const todosToCreate = todos.map(todo => ({
      userId,
      title: todo.title,
      completed: todo.completed || false,
      completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined,
      createdAt: todo.createdAt ? new Date(todo.createdAt) : new Date(),
    }));

    if (todosToCreate.length > 0) {
      await Todo.insertMany(todosToCreate);
    }

    return res.json({ success: true, count: todosToCreate.length });
  } catch (err) {
    console.error('Sync todos error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Récupérer les todos de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const todos = await Todo.find({ userId }).sort({ createdAt: -1 });
    return res.json({ todos });
  } catch (err) {
    console.error('Get todos error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Créer un nouveau todo
router.post('/', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }

    const todo = await Todo.create({
      userId,
      title: title.trim(),
      completed: false,
      createdAt: new Date(),
    });

    return res.status(201).json({ todo });
  } catch (err) {
    console.error('Create todo error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Mettre à jour un todo (pour toggle completed)
router.put('/:id', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { id } = req.params;
    const { completed, title } = req.body;

    // Chercher le todo par ID et userId pour s'assurer qu'il appartient à l'utilisateur
    let todo = await Todo.findOne({ _id: id, userId });
    
    // Si le todo n'existe pas, le créer (au cas où il n'aurait pas été sauvegardé)
    if (!todo) {
      if (!title) {
        return res.status(404).json({ error: 'todo_not_found' });
      }
      // Créer le todo s'il n'existe pas encore
      todo = await Todo.create({
        userId,
        title: title.trim(),
        completed: completed || false,
        completedAt: completed ? new Date() : undefined,
        createdAt: new Date(),
      });
      return res.json({ todo });
    }

    // Mettre à jour le todo
    if (typeof completed === 'boolean') {
      todo.completed = completed;
      todo.completedAt = completed ? new Date() : undefined;
    }
    if (title && title.trim()) {
      todo.title = title.trim();
    }

    await todo.save();
    return res.json({ todo });
  } catch (err) {
    console.error('Update todo error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Supprimer un todo
router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { id } = req.params;
    const todo = await Todo.findOneAndDelete({ _id: id, userId });
    
    if (!todo) {
      return res.status(404).json({ error: 'todo_not_found' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete todo error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Envoyer un email de test
router.post('/test-email', async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || !user.email) {
      return res.status(400).json({ error: 'user_email_not_found' });
    }

    const { sendTodoReminderEmail } = await import('../services/emailService.js');
    
    // Créer une liste de test
    const testTodos = [
      { title: 'Tâche de test 1' },
      { title: 'Tâche de test 2' },
    ];

    const emailSent = await sendTodoReminderEmail(
      user.email,
      user.name || 'Utilisateur',
      testTodos
    );

    if (emailSent) {
      return res.json({ success: true, message: 'Test email sent' });
    } else {
      return res.status(500).json({ error: 'email_send_failed' });
    }
  } catch (err) {
    console.error('Test email error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;

