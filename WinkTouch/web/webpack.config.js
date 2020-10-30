const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RULES = require('./webpack.rules');
const rootDir = path.join(__dirname, '..');
const webpackEnv = process.env.NODE_ENV || 'development';

module.exports = {
  mode: webpackEnv,
  entry: {
    app: path.join(rootDir, './index.web.js'),
  },
  devtool: 'source-map',
  module: {
    rules: RULES,
  },
  output: {
    path: path.resolve(rootDir, 'dist'),
    filename: 'app-[hash].bundle.js',
    publicPath: '/',
  },
  devServer: {
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, './index.html'),
      filename: 'index.html',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development',
      ),
      __DEV__: process.env.NODE_ENV === 'production' || true,
    }),
  ],
  resolve: {
    extensions: ['.web.jsx', '.web.js', '.jsx', '.js'],
    alias: Object.assign({
      'react-native$': 'react-native-web',
      'react-native-localization': 'react-localization',
      'react-native-fs': path.join(
        rootDir,
        './src/components/ReactFileSystem/ReactNativeFSWeb.js',
      ),
    }),
  },
};
