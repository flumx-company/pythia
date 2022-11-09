const webpack = require('webpack');
const webpackMiddleware = require('koa-webpack');
const webpackConfig = require('../webpack.dev.js');

const webpackCompiler = webpack(webpackConfig);

module.exports = app => {
  app.use(webpackMiddleware({
    compiler: webpackCompiler,
    dev: {
      publicPath: webpackConfig.output.publicPath,
    },
  }));
};
