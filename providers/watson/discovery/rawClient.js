const http = require('http');
const https = require('https');
const axios = require('axios');
const {
  services: {
    watson: {
      discovery: {
        url,
        apiKey,
        apiVersion,
        apiVersionDate,
      },
    },
  },
} = require('../../../config');

module.exports = axios.create({
  baseURL: `${url}/${apiVersion}`,
  params: {
    version: apiVersionDate,
  },
  auth: {
    username: 'apikey',
    password: apiKey,
  },
  timeout: 60 * 1000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});
