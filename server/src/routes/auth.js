import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const router = Router();

function generateToken(userId) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name: name || '',
    });

    const token = generateToken(user.id);
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const token = generateToken(user.id);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'credential is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'google_oauth_not_configured' });
    }

    const client = new OAuth2Client(clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
    } catch (err) {
      return res.status(401).json({ error: 'invalid_google_token' });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'invalid_google_token' });
    }

    const { sub: googleId, email, name, picture } = payload;
    if (!email) {
      return res.status(400).json({ error: 'email_not_provided_by_google' });
    }

    // Chercher un utilisateur existant par googleId ou email
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Mettre à jour si nécessaire
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture) user.picture = picture;
        await user.save();
      }
    } else {
      // Créer un nouvel utilisateur
      user = await User.create({
        email: email.toLowerCase(),
        googleId,
        name: name || '',
        picture: picture || '',
      });
    }

    const token = generateToken(user.id);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;


