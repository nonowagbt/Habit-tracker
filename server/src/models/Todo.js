import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    lastReminderSent: { type: Date }, // Dernière fois qu'un rappel a été envoyé
  },
  { timestamps: true }
);

export default mongoose.model('Todo', todoSchema);

