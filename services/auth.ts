import passport from 'passport';

const Client = require('../db/models/Client');
const { toPlain } = require('../helpers/database');

export const signup = async () => {
  return new Promise((resolve, reject) => {
    passport.authenticate('signup', { session: false }, (err, user) => {
      if (err) {
        return reject(err);
      }

      return resolve(user);
    });
  });
};

export const jwtSecretKey = 'pythia_jwt_secret_there_is_no_spoon';

export const authenticateViaClientId = async ({ headers, headers: { authorization } }: any, next: any): Promise<boolean> => {
  if (authorization) {
    const [type, id] = authorization.split(' ');

    if (type === 'Client') {
      try {
        const client = toPlain(await Client.findOne({ where: { id } }));

        if (client) {
          // return next();
          return true;
        }
      } catch (err) {}
    }
  }

  return false;
};
