const _ = require('lodash');
const path = require('path');
const cyrillicToTranslit = require('cyrillic-to-translit-js')();
const Papa = require('papaparse');
const fs = require('fs-extra');
const chalk = require('chalk');
// eslint-disable-next-line
const yargs = require('yargs')
  .usage('Translits SVG and JSON files.\n\nUsage: translit <input> <output>')
  .example(
    'translit folder',
    `Translit all files and folders in ${chalk.bold('folder')} recursively and output them to ${chalk.bold('folder_translit')}`,
  )
  .example(
    'translit folder another_folder',
    `Translit all files and folders in ${chalk.bold('folder')} recursively and output them to ${chalk.bold('another_folder')}`,
  )
  .example(
    'translit file.svg',
    `Translit single file and output it to ${chalk.bold('file_translit.svg')}`,
  );

const { argv } = yargs;

const { _: [input, output] } = argv;

if (!input) {
  yargs.showHelp();
  process.exit(0);
}

const INPUT = path.resolve(input);
const OUTPUT = output && path.resolve(output);

const translitCsvData = data =>
  _.map(data, chunk =>
    (_.isArray(chunk) ? translitCsvData(chunk) : cyrillicToTranslit.transform(chunk)));

const translitJsonData = data => {
  if (_.isPlainObject(data)) {
    return _.mapValues(data, value => translitJsonData(value));
  } else if (_.isArray(data)) {
    return _.map(data, value => translitJsonData(value));
  } else if (_.isString(data)) {
    return cyrillicToTranslit.transform(data);
  }

  return data;
};

const getTranslittedJson = async filePath => {
  const data = await fs.readJson(filePath);
  return JSON.stringify(translitJsonData(data), null, 2);
};

const getTranslittedCsv = async filePath => {
  const fileContent = await fs.readFile(filePath, 'utf8');
  const { data } = Papa.parse(fileContent);
  return Papa.unparse(translitCsvData(data));
};

const getTranslittedCustomData = filePath => fs.readFile(filePath, 'utf8');

const translitFile = async (inputPath, outputPath) => {
  const fileExtension = path.extname(inputPath);

  let processedData;

  if (fileExtension === '.json') {
    processedData = await getTranslittedJson(inputPath);
  } else if (fileExtension === '.csv') {
    processedData = await getTranslittedCsv(inputPath);
  } else {
    processedData = await getTranslittedCustomData(inputPath);
  }

  await fs.outputFile(outputPath, processedData);
};

const getDefaultTranslittedPath = async inputPath => {
  const inputStats = await fs.lstat(inputPath);
  const inputIsFile = inputStats.isFile();

  if (inputIsFile) {
    const fileExtension = path.extname(inputPath);
    const fileName = path.basename(inputPath, fileExtension);
    const fileDirectory = path.dirname(inputPath);
    const fileFullName = `${fileName}_translit${fileExtension}`;

    return path.resolve(fileDirectory, fileFullName);
  }

  return path.resolve(`${inputPath}_translit`);
};

const processFileOrDirectory = async (inputPath, outputPath) => {
  const inputAbsolutePath = path.resolve(inputPath);
  const outputAbsolutePath = path.resolve(outputPath || await getDefaultTranslittedPath(inputPath));
  const inputStats = await fs.lstat(inputAbsolutePath);
  const inputIsFile = inputStats.isFile();
  const inputIsDirectory = inputStats.isDirectory();

  if (inputIsFile) {
    await translitFile(inputAbsolutePath, outputAbsolutePath);
  } else if (inputIsDirectory) {
    const filesOrDirectories = await fs.readdir(inputAbsolutePath);

    for (const fileOrDirectory of filesOrDirectories) {
      const nestedInputAbsolutePath = path.resolve(inputAbsolutePath, fileOrDirectory);
      const nestedOutputAbsolutePath = path.resolve(outputAbsolutePath, fileOrDirectory);

      await processFileOrDirectory(nestedInputAbsolutePath, nestedOutputAbsolutePath);
    }
  }
};

(async () => {
  try {
    await processFileOrDirectory(INPUT, OUTPUT);
    console.log(chalk.green('Done!'));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
})();
