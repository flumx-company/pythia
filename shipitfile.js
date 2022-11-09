require('dotenv').config();

const { existsSync } = require('fs');
const { resolve } = require('path');
const utils = require('shipit-utils');

module.exports = shipit => {
  const localEnvFilePath = resolve('./.env.remote');

  if (!existsSync(localEnvFilePath)) {
    throw new Error('.env.remote file not found in the root project directory');
  }

  // eslint-disable-next-line global-require
  require('shipit-deploy')(shipit);

  shipit.initConfig({
    default: {
      workspace: '/tmp/pythia',
      deployTo: '/var/pythia',
      repositoryUrl: 'git@github.com:evenfrost/pythia-core.git',
      ignores: ['.git', 'node_modules', 'tmp'],
      keepReleases: 2,
      deleteOnRollback: false,
      key: '/home/evenfrost/.ssh/id_rsa',
      shallowClone: true,
    },
    production: {
      servers: 'root@159.65.206.66',
    },
  });

  const cwd = `${shipit.config.deployTo}/current`;

  shipit.blTask('copy:env', () => {
    shipit.copyToRemote(
      localEnvFilePath,
      resolve(shipit.releasePath, '.env'),
    );
  });

  shipit.blTask('npm:install', () => shipit.remote('npm install', { cwd }));
  shipit.blTask('npm:build', () => shipit.remote('npm run build', { cwd }));
  shipit.blTask('db:sync', () => shipit.remote('npm run db:sync', { cwd }));
  shipit.blTask('db:sync-force', () => shipit.remote('npm run db:sync -- --force', { cwd }));
  shipit.blTask('db:migrate', () => shipit.remote('npm run db:migrate', { cwd }));
  shipit.blTask('docker:start', () => shipit.remote('docker-compose up -d', { cwd }));
  shipit.blTask('forever:stop', () => shipit.remote('forever stop pythia-core', { cwd }));
  shipit.blTask('forever:start', () => shipit.remote('npm run forever', { cwd }));

  const tasks = [
    'copy:env',
    'npm:install',
    'npm:build',
    'db:sync',
    'db:migrate',
    'docker:start',
    'forever:stop',
    'forever:start',
  ];

  utils.registerTask(shipit, 'bootstrap', tasks);

  shipit.on('deployed', () => {
    shipit.start('bootstrap');
  });
};
