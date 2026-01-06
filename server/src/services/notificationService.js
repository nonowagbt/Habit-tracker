import cron from 'node-cron';
import Todo from '../models/Todo.js';
import User from '../models/User.js';
import { sendTodoReminderEmail } from './emailService.js';

let notificationJob = null;

export function startNotificationService() {
  // Arrêter le job existant s'il y en a un
  if (notificationJob) {
    notificationJob.stop();
  }

  // Vérifier si les notifications sont activées
  const notificationsEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';
  if (!notificationsEnabled) {
    console.log('📧 Email notifications are disabled (ENABLE_EMAIL_NOTIFICATIONS=false)');
    return;
  }

  // Récupérer la fréquence depuis les variables d'environnement (par défaut: tous les jours à 9h)
  const cronSchedule = process.env.EMAIL_CRON_SCHEDULE || '0 9 * * *'; // Tous les jours à 9h

  console.log(`📧 Starting email notification service (schedule: ${cronSchedule})`);

  notificationJob = cron.schedule(cronSchedule, async () => {
    try {
      console.log('📧 Checking for pending todos to notify...');
      
      // Récupérer tous les utilisateurs
      const users = await User.find({});
      
      for (const user of users) {
        // Récupérer les todos non complétées de l'utilisateur
        const pendingTodos = await Todo.find({
          userId: user._id,
          completed: false,
        });

        if (pendingTodos.length > 0) {
          // Vérifier si on a déjà envoyé un rappel aujourd'hui
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const lastReminderToday = pendingTodos.some(todo => 
            todo.lastReminderSent && 
            new Date(todo.lastReminderSent) >= today
          );

          if (!lastReminderToday && user.email) {
            console.log(`📧 Sending reminder to ${user.email} for ${pendingTodos.length} pending todos`);
            
            const emailSent = await sendTodoReminderEmail(
              user.email,
              user.name || 'Utilisateur',
              pendingTodos.map(t => ({ title: t.title }))
            );

            if (emailSent) {
              // Mettre à jour lastReminderSent pour tous les todos
              await Todo.updateMany(
                { userId: user._id, completed: false },
                { lastReminderSent: new Date() }
              );
            }
          }
        }
      }

      console.log('📧 Notification check completed');
    } catch (error) {
      console.error('Error in notification service:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Paris', // Ajustez selon votre fuseau horaire
  });
}

export function stopNotificationService() {
  if (notificationJob) {
    notificationJob.stop();
    console.log('📧 Email notification service stopped');
  }
}

