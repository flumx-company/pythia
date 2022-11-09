const { request } = require('../helpers/request');

exports.list = (query, params) => request('get', 'dynamic_content/items', query, params);
