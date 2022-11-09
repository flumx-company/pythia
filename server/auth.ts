import passport from 'koa-passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JWTStrategy, ExtractJwt as ExtractJWT } from 'passport-jwt';
import _ from 'lodash';
import { jwtSecretKey } from '../services/auth';

const { toPlain } = require('../helpers/database');
const User = require('../db/models/User');

passport.use('signup', new LocalStrategy({
  usernameField : 'email',
  passwordField : 'password',
}, async (email, password, done) => {
    try {
      const user = toPlain(await User.create({ email, password }));

      return done(null, _.omit(user, 'password'));
    } catch (error) {
      done(error);
    }
}));

passport.use('login', new LocalStrategy({
  usernameField : 'email',
  passwordField : 'password',
}, async (email, password, done) => {
  try {
    const dbUser = await User.scope('withPassword').findOne({ where: { email } });
    const user = toPlain(dbUser);

    if (!user) {
      return done(null, false, { message : 'User not found' });
    }

    const valid = await dbUser.isValidPassword(password);

    if (!valid) {
      return done(null, false, { message : 'Wrong Password' });
    }

    return done(null, user, { message : 'Logged in Successfully' });
  } catch (error) {
    return done(error);
  }
}));

passport.use(new JWTStrategy({
  secretOrKey : jwtSecretKey,
  jwtFromRequest : ExtractJWT.fromAuthHeaderAsBearerToken(),
}, async (token, done) => {
  try {
    return done(null, token.user);
  } catch (error) {
    done(error);
  }
}));

passport.initialize();
