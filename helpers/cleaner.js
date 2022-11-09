const _ = require('lodash');

exports.cleanText = (text = '', stringsToReplace = []) => {
  // remove redundant spaces from text
  text = _.replace(text, /\s+/g, ' ');

  _.forEach(stringsToReplace, chunk => {
    text = _.replace(text, chunk, '');
  });

  text = _.trim(text);

  return text;
};
