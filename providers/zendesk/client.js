const zendesk = require('node-zendesk');
const { services: { zendesk: { username, token, url } } } = require('../../config');

module.exports = zendesk.createClient({
  username,
  token,
  remoteUri: url,
  disableGlobalState: true,
});
