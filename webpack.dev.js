const { resolve } = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const commonConfig = require('./webpack.common.js');
const { server: { port: serverPort } } = require('./config');

const DEV_SERVER_PORT = 5100;

module.exports = merge(commonConfig, {
  devtool: 'inline-source-map',
  mode: 'development',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  devServer: {
    contentBase: resolve(__dirname, 'build/client'),
    port: DEV_SERVER_PORT,
    hot: true,
    publicPath: '/',
    historyApiFallback: true,
    proxy: {
      '/': {
        target: `http://localhost:${serverPort}`,
        secure: false,
      },
    },
  },
});
