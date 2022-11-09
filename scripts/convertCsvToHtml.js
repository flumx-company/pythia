require('dotenv').config();

const { resolve } = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const { csvParseRows } = require('d3-dsv');
const { readTmpFile, writeTmpFile, zipDirectory } = require('../helpers/file');
const { argv } = require('yargs');
const logger = require('../helpers/logger');

const INPUT_FILENAME = argv.inputFilename || 'exp.csv';
const OUTPUT_FILENAME = argv.outputFilename || 'exp.zip';

const convertToHtml = chunk => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document</title>
</head>
<body>
  <h1>${chunk[0]}</h1>
  <p>${chunk[1]}</p>
</body>
</html>
`;

const run = async () => {
  try {
    const text = await readTmpFile(INPUT_FILENAME);
    const data = csvParseRows(text);

    await Promise.all(_.map(data, async (chunk, index) =>
      writeTmpFile(`html/${index + 1}.html`, convertToHtml(chunk))));

    await zipDirectory(resolve(__dirname, '../tmp/html'), resolve(__dirname, '../tmp', OUTPUT_FILENAME));
    await fs.remove(resolve(__dirname, '../tmp/html'));

    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

run();

