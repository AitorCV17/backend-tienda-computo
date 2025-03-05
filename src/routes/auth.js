/**
 * Archivo: src/routes/auth.js
 * Descripción: Rutas de autenticación (registro, login y Google OAuth).
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const prisma = require('../prismaClient');
const passport = require('../config/passport');

// Registro de usuario
router.post('/register', async (req, res) => {
  const { nombreUsuario, correo, contrasena } = req.body;
  try {
    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({ where: { nombreUsuario } });
    if (usuarioExistente) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }
    if (correo) {
      const correoExistente = await prisma.usuario.findUnique({ where: { correo } });
      if (correoExistente) {
        return res.status(409).json({ message: 'El correo ya está registrado' });
      }
    }
    const contrasenaHasheada = await bcrypt.hash(contrasena, 10);
    const nuevoUsuario = await prisma.usuario.create({
      data: { nombreUsuario, correo, contrasena: contrasenaHasheada }
    });
    return res.status(201).json({ id: nuevoUsuario.id, nombreUsuario: nuevoUsuario.nombreUsuario, correo: nuevoUsuario.correo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error registrando usuario' });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  const { nombreUsuario, contrasena } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario } });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const esValido = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValido) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ sub: usuario.nombreUsuario }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en el login' });
  }
});

// Google OAuth: Inicia autenticación
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth: Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generar token JWT y redirigir al frontend con el token
    const token = jwt.sign({ sub: req.user.nombreUsuario }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
    res.redirect(`${config.FRONTEND_URL}/auth/google/callback?token=${token}`);
  }
);

module.exports = router;
