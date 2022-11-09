const { request } = require('../helpers/request');

exports.list = (query, params) => request('get', 'macros', query, params);
