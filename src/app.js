/**
 * Archivo: src/app.js
 * Descripción: Configuración y middleware de la aplicación Express.
 */

require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');
const config = require('./config/config');

// Importar rutas
const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const carritoRoutes = require('./routes/carrito');
const ordenesRoutes = require('./routes/ordenes');

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Limitador de tasa para prevenir abusos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo de 100 peticiones por IP
});
app.use(limiter);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/ordenes', ordenesRoutes);

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;
