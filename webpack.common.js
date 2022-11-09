const { resolve } = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const rootResolve = path => resolve(__dirname, path);
const isProduction = process.env.NODE_ENV === 'production';

const formStylesRule = (useModules = false) => ({
  test: /\.pcss$/,
  [useModules ? 'exclude' : 'include']: /client\/styles/,
  use: [
    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
    {
      loader: 'css-loader',
      options: {
        url: false,
        importLoaders: 1,
        sourceMap: true,
        ...(useModules && {
          modules: true,
          localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
        }),
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
      },
    },
  ],
});

module.exports = {
  entry: [rootResolve('client/index.tsx')],
  output: {
    filename: 'bundle.js',
    path: rootResolve('build/client'),
    publicPath: '/',
    // for node_modules' files to be shown in Chrome DevTools. See:
    // https://github.com/webpack/webpack/issues/6400#issuecomment-361848494
    devtoolModuleFilenameTemplate(info) {
      return `file:///${info.absoluteResourcePath.replace(/\\/g, '/')}`;
    },
  },
  module: {
    rules: [
      formStylesRule(false),
      formStylesRule(true),
      {
        enforce: 'pre',
        exclude: /node_modules/,
        test: /\.js$/,
        loader: 'source-map-loader',
      },
      {
        test: /\.ts|\.tsx$/,
        include: resolve(__dirname, './client'),
        use: [
          { loader: 'babel-loader' },
          {
            loader: 'ts-loader',
            options: {
              configFile: resolve(__dirname, 'client/tsconfig.json'),
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        exclude: /node_modules/,
        loader: 'react-svg-loader',
      },
    ],
  },
  plugins: [
    new CheckerPlugin(),
    // new webpack.NamedModulesPlugin(),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'bundle.css',
    }),
    new ForkTsCheckerWebpackPlugin({
      tslint: false,
      checkSyntacticErrors: true,
      watch: ['./client'],
    }),
    // new WriteFilePlugin({
    //   // exclude hot-update files
    //   test: /^(?!.*(hot)).*/,
    // }),
  ],
  resolve: {
    extensions: ['*', '.mjs', '.js', '.json', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': rootResolve('client'),
    },
  },
};
