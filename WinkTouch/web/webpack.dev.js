const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RULES = require('./webpack.rules');
const rootDir = path.join(__dirname, '..');
const webpackEnv = 'development';

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
      __DEV__: true,
    }),
  ],
  resolve: {
    extensions: ['.web.jsx', '.web.js', '.jsx', '.js'],
    alias: Object.assign({
      'react-native$': 'react-native-web',
      'react-native-localization': 'react-localization',
      'react-native-fs': path.join(
        rootDir,
        './src/components/ReactFileSystem/ReactNativeFS.web.js',
      ),
      'react-native-view-shot': 'react-native-view-shot-with-web-support',
      'react-native-pdf-lib': 'pdf-lib',
      'react-native-webview': 'react-native-web-webview',
      'react-native-a-beep': path.join(
        rootDir,
        './src/components/ReactNativeBeep/index.web.js',
      ),
      'react-native-code-push': path.join(
        rootDir,
        './src/components/CodePush/index.web.js',
      ),
    }),
  },
};
