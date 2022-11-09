const merge = require('webpack-merge');
const cssNano = require('cssnano');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const commonConfig = require('./webpack.common.js');

module.exports = merge(commonConfig, {
  mode: 'production',
  plugins: [
    new OptimizeCssAssetsPlugin({
      cssProcessor: cssNano,
      cssProcessorOptions: { discardComments: { removeAll: true } },
      canPrint: true,
    }),
  ],
});
