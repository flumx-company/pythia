require('dotenv').config();

const execa = require('execa');
const { argv } = require('yargs');

const exec = async command => (await execa.shell(command)).stdout;

const {
  POSTGRES_USER,
  POSTGRES_DB,
} = process.env;

const run = async () => {
  try {
    const file = argv.file || 'dump.sql';
    const dockerComposeServiceName = argv.dockerComposeServiceName || 'db';
    const dockerContainerId = await exec(`docker-compose ps -q ${dockerComposeServiceName}`);
    const res = await exec(`cat "${file}" | docker exec -i "${dockerContainerId}" psql -U "${POSTGRES_USER}" -W ${POSTGRES_DB}`);
  } catch (err) {
    console.error(err);
  }
};

run();
