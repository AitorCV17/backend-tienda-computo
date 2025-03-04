// src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const prisma = require('../prismaClient');
const passport = require('../config/passport');

// Registro
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ message: 'El email ya está registrado' });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword }
    });
    return res.status(201).json({ id: user.id, username: user.username, email: user.email });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error registrando usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ sub: user.username }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en el login' });
  }
});

// Google OAuth: Inicia
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ sub: req.user.username }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    res.redirect(`${config.FRONTEND_URL}/auth/google/callback?token=${token}`);
  }
);

module.exports = router;
