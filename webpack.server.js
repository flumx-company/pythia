const { resolve } = require('path');
const nodeExternals = require('webpack-node-externals');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const rootResolve = pathname => resolve(__dirname, pathname);

module.exports = {
  entry: './server/index.ts',
  mode: 'production',
  output: {
    path: rootResolve('build'),
    filename: 'server.js',
  },
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
    Buffer: false,
    global: false,
    process: false,
    setImmediate: false,
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts|\.tsx$/,
        exclude: /node_modules/,
        use: [
          'ts-loader',
        ],
      },
    ],
  },
  plugins: [new CleanWebpackPlugin()],
  resolve: {
    extensions: ['*', '.js', '.json', '.jsx', '.d.ts', '.ts', '.tsx'],
    alias: {
      '@': rootResolve('.'),
    },
  },
};
