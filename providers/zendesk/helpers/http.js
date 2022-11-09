const http = require('http');
const https = require('https');
const axios = require('axios');
// const logger = require('../../../helpers/logger');

const api = axios.create({
  timeout: 60 * 1000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

// api.interceptors.request.use(request => {
//   logger.debug(request);
//   return request;
// });

module.exports = api;
