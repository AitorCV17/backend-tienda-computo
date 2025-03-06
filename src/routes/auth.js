/**
 * Archivo: src/routes/auth.js
 * Descripción: Rutas de autenticación (registro, login y Google OAuth),
 *              y también manejo de perfil.
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const prisma = require('../prismaClient');
const passport = require('../config/passport');
const { autenticarToken } = require('../middleware/auth');

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
    return res.status(201).json({
      id: nuevoUsuario.id,
      nombreUsuario: nuevoUsuario.nombreUsuario,
      correo: nuevoUsuario.correo
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error registrando usuario' });
  }
});

// Login de usuario (por correo o nombreUsuario)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Buscar primero por correo
    let usuario = await prisma.usuario.findUnique({ where: { correo: email } });
    // Si no se encontró, probar con nombreUsuario
    if (!usuario) {
      usuario = await prisma.usuario.findUnique({ where: { nombreUsuario: email } });
    }
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const esValido = await bcrypt.compare(password, usuario.contrasena);
    if (!esValido) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    // Guardar el ID del usuario en el token
    const token = jwt.sign({ sub: usuario.id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });
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
    // Guardar el ID del usuario en el token
    const token = jwt.sign({ sub: req.user.id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });
    res.redirect(`${config.FRONTEND_URL}/auth/google/callback?token=${token}`);
  }
);

// Obtener datos de perfil
router.get('/profile', autenticarToken, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id }
    });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.json({
      nombre: usuario.nombreUsuario,
      email: usuario.correo
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error cargando perfil' });
  }
});

// Actualizar datos de perfil
router.put('/profile', autenticarToken, async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    // Buscar por ID
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const dataToUpdate = {};
    if (nombre) dataToUpdate.nombreUsuario = nombre;
    if (email) dataToUpdate.correo = email;

    // Si envían password y no está vacío
    if (password && password.trim() !== '') {
      const contrasenaHasheada = await bcrypt.hash(password, 10);
      dataToUpdate.contrasena = contrasenaHasheada;
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: dataToUpdate
    });

    return res.json({ message: 'Perfil actualizado correctamente', usuario: usuarioActualizado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

module.exports = router;
