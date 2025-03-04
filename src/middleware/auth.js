// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const prisma = require('../prismaClient');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  jwt.verify(token, config.JWT_SECRET, async (err, payload) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    try {
      const user = await prisma.user.findUnique({ where: { username: payload.sub } });
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error en autenticación' });
    }
  });
};

module.exports = { authenticateToken };
