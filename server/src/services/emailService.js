import nodemailer from 'nodemailer';

let transporter = null;

function initEmailService() {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // Mot de passe d'application Gmail ou mot de passe SMTP
    },
  };

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️  Email service not configured. SMTP_USER and SMTP_PASS required in .env');
    return false;
  }

  transporter = nodemailer.createTransport(emailConfig);
  return true;
}

export async function sendTodoReminderEmail(userEmail, userName, pendingTodos) {
  if (!transporter) {
    if (!initEmailService()) {
      console.error('Cannot send email: Email service not configured');
      return false;
    }
  }

  const todoList = pendingTodos
    .map((todo, index) => `${index + 1}. ${todo.title}`)
    .join('\n');

  const mailOptions = {
    from: `"Habit Tracker" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `📋 Rappel : ${pendingTodos.length} tâche(s) en attente`,
    text: `Bonjour ${userName || 'Utilisateur'},

Vous avez ${pendingTodos.length} tâche(s) non complétée(s) dans votre liste :

${todoList}

N'oubliez pas de les compléter pour maintenir votre streak ! 💪

Cordialement,
Habit Tracker`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #34d399; margin-top: 0;">📋 Rappel : ${pendingTodos.length} tâche(s) en attente</h2>
          <p>Bonjour <strong>${userName || 'Utilisateur'}</strong>,</p>
          <p>Vous avez <strong>${pendingTodos.length}</strong> tâche(s) non complétée(s) dans votre liste :</p>
          <ul style="background: #f9f9f9; padding: 15px; border-radius: 4px; list-style: none;">
            ${pendingTodos.map((todo, index) => `
              <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="color: #34d399; font-weight: bold;">${index + 1}.</span> ${todo.title}
              </li>
            `).join('')}
          </ul>
          <p style="margin-top: 20px;">N'oubliez pas de les compléter pour maintenir votre streak ! 💪</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">Cordialement,<br>Habit Tracker</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Initialiser le service au démarrage
initEmailService();

