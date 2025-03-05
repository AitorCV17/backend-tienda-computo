/**
 * Archivo: src/config/config.js
 * Descripción: Configuración del entorno y variables globales.
 */
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8000,
  JWT_SECRET: process.env.JWT_SECRET || 'clave_super_secreta',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};
