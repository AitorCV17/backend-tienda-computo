/**
 * Archivo: src/config/passport.js
 * Descripción: Configuración de Passport para autenticación con Google OAuth2.
 */
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');
const config = require('./config');

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const correo = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
      const nombreUsuario = profile.displayName || (correo ? correo.split('@')[0] : 'usuarioGoogle');
      if (!correo) {
        return done(null, false, { message: 'No se encontró correo en el perfil de Google' });
      }
      // Buscar usuario por correo
      let usuario = await prisma.usuario.findUnique({ where: { correo } });
      if (!usuario) {
        // Si no existe, crear usuario con contraseña aleatoria
        const contrasenaAleatoria = Date.now().toString();
        const contrasenaHasheada = await bcrypt.hash(contrasenaAleatoria, 10);
        usuario = await prisma.usuario.create({
          data: {
            nombreUsuario,
            correo,
            contrasena: contrasenaHasheada
          }
        });
      }
      return done(null, usuario);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((usuario, done) => {
  done(null, usuario.nombreUsuario);
});

passport.deserializeUser(async (nombreUsuario, done) => {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario } });
    done(null, usuario);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
