const { promisify } = require('util');

const createClient = require('../client');

module.exports = {
  create: ({
    name,
    description,
    size = 1,
    username,
    password,
    apiKey,
  } = {}) => {
    const client = createClient({
      username,
      password,
      apiKey,
    });

    return promisify(client.createEnvironment.bind(client))({
      name, description, size,
    });
  },
  list: ({
    username,
    password,
    apiKey,
  } = {}) => {
    const client = createClient({
      username,
      password,
      apiKey,
    });

    return promisify(client.listEnvironments.bind(client))({}).then(
      ({ environments }) => environments,
    );
  },
};
