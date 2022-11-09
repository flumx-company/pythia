const { resolve: resolvePath } = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const logger = require('./logger');

exports.readFile = filepath => fs.readFile(filepath, 'utf8');
exports.writeFile = (filepath, data) => fs.outputFile(filepath, data);
exports.readTmpFile = filepath => exports.readFile(resolvePath(__dirname, '../tmp', filepath), 'utf8');
exports.writeTmpFile = (filepath, data) => fs.outputFile(resolvePath(__dirname, '../tmp', filepath), data);

exports.importJsonFromFile = filepath => fs.readJson(filepath);
exports.saveJsonToFile = (filepath, data) => fs.outputJson(filepath, data, { spaces: 2 });
exports.importJsonFromTempFile = filepath => exports.importJsonFromFile(resolvePath(__dirname, '../tmp', filepath));

exports.saveJsonToTempFile = (filepath, data) => (
  exports.saveJsonToFile(resolvePath(__dirname, '../tmp', filepath), data)
);

exports.zipDirectory = (inputPath, outputPath) => new Promise((resolve, reject) => {
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  output.on('close', () => {
    resolve(archive.pointer());
  });

  archive.on('warning', err => {
    logger.warn(err);
  });

  archive.on('error', err => {
    reject(err);
  });

  archive.pipe(output);

  archive.directory(inputPath, false);

  archive.finalize();
});

exports.getFileExtension = filename => filename.split('.').pop();
