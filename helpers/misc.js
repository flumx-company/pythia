const path = require('path');
const _ = require('lodash');
const cyrillicToTranslit = require('cyrillic-to-translit-js');

exports.delay = async ms => new Promise(resolve => setTimeout(resolve, ms));

exports.getCurrentDate = () => {
  const now = new Date();

  return `${now.getFullYear()}-${now.getMonth() + 1}-${_.padStart(now.getDate(), 2, '0')}`;
};

exports.getUTCDate = (dateString = Date.now()) => {
  const date = new Date(dateString);

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
};

exports.translit = string => cyrillicToTranslit().transform(string);

exports.formatNaturalLanguageQuery = query => {
  const charactersToSkip = ['{', '}'];

  const limitQuery = queryString =>
    (encodeURIComponent(queryString).length > 2000
      ? limitQuery(queryString.slice(0, -25))
      : queryString);

  // TODO: join all regexpes into one
  // remove disallowed characters
  query = _.replace(query, new RegExp(_.join(charactersToSkip, '|'), 'g'), '');
  // remove duplicate hyphens
  query = _.replace(query, /-(?=-)/g, '');
  // remove duplicate spaces
  query = _.replace(query, /\s(?=\s)/g, '');

  query = _.trim(query);

  query = limitQuery(query);

  return query;
};

exports.rootResolve = pathname => path.resolve(__dirname, pathname);
