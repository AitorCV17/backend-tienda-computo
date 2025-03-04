// src/config/passport.js
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
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
      const username = profile.displayName || (email ? email.split('@')[0] : 'googleUser');
      if (!email) {
        return done(null, false, { message: 'No email in Google profile' });
      }
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        const randomPass = Date.now().toString();
        const hashed = await bcrypt.hash(randomPass, 10);
        user = await prisma.user.create({
          data: {
            username,
            email,
            password: hashed
          }
        });
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
