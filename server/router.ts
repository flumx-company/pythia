import Router from 'koa-router';
import passport from 'koa-passport';
import jwt from 'jsonwebtoken';
import { jwtSecretKey } from '@/services/auth';

const { isProduction } = require('../config');

interface LoginResponseBody {
  id: string;
  email: string;
  token?: string;
}

export const graphQlPath = '/api';

const router = new Router();

// router.post('/signup', passport.authenticate('signup', {
//   session: false,
// }), ctx => {
//   ctx.type = 'json';
//   ctx.body = {
//     message: 'Signup successful',
//     user: ctx.state.user,
//   };
// });

router.post('/login', async (ctx, next) => {
  return passport.authenticate('login', async (err, user) => {
    if (user) {
      await ctx.login(user, { session: false });

      const body: LoginResponseBody = {
        id: user.id,
        email: user.email,
      };

      const token = jwt.sign({ user: body }, jwtSecretKey);
      ctx.body = { token };
    } else {
      ctx.status = 400;
      ctx.body = { error: 'Bad credentials' };
    }
  })(ctx, next);
});

router.get('/', ctx => {
  ctx.render('index', { isProduction }, true);
});

router.get('*', (ctx, next) => {
  if (ctx.request.url === '/api') {
    next();
  }

  ctx.render('index', { isProduction }, true);
});

export default router;
