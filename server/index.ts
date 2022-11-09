import '@/server/auth';

import path from 'path';
import cors from '@koa/cors';
import { ApolloServer } from 'apollo-server-koa';
import Koa from 'koa';
import helmet from 'koa-helmet';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import koaBunyanLogger from 'koa-bunyan-logger';
import Pug from 'koa-pug';
import mount from 'koa-mount';
import passport from 'koa-passport';
import error from 'koa-json-error';
import { typeDefs } from '@/server/schema';
import resolvers from '@/server/api/resolvers';
import router, { graphQlPath } from '@/server/router';
import { authenticateViaClientId } from '@/services/auth';
import config from '@/config';
import logger from '@/helpers/logger';

const {
  server: {
    port: serverPort,
  },
  isProduction,
} = config;

const app = new Koa();

// @ts-ignore
app.use(error(({ status = 500, message }) => ({
  status,
  message,
})));

app.use(helmet());
app.use(koaBunyanLogger(logger));
app.use(cors({
  origin: '*',
}));
app.use(bodyParser());

app.use(passport.initialize());

app.use(serve(path.resolve(__dirname, '../static')));
app.use(serve(path.resolve(__dirname, '../build/client')));

if (isProduction) {
  app.use(mount(graphQlPath, async (ctx, next) => {
    const isValidClient = await authenticateViaClientId(ctx, next);

    if (isValidClient) {
      return next();
    }

    return passport.authenticate('jwt', { session: false })(ctx, next);
  }));
}

app.use(router.routes());
app.use(router.allowedMethods());

// @ts-ignore
new Pug({
  app,
  viewPath: path.resolve(__dirname, '../views'),
  noCache: !isProduction,
  locals: {
    isProduction,
  },
});

const server = app.listen(serverPort);

const graphQlServer = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: '/api',
  formatError(err) {
    logger.error(err);
    err.message = 'Internal server error. Please contact the administrator';
    return err;
  },
});

graphQlServer.applyMiddleware({
  app,
  path: graphQlPath,
});

graphQlServer.installSubscriptionHandlers(server);
