import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: false },
    name: { type: String },
    googleId: { type: String, unique: true, sparse: true, index: true },
    picture: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);


