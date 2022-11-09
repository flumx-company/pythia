const request = require('../helpers/chatRequest');

exports.list = ({
  token,
} = {}) => request('shortcuts', {
  token,
});
