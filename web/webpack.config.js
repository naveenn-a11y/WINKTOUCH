// module.exports = (env) => {
//   return require(`./webpack.${env.goal}.js`);
// };

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RULES = require('./webpack.rules');
const rootDir = path.join(__dirname, '..');
const fs = require('fs');

module.exports = (env, mode) => {
  const isDev = env.MODE === 'development';
  const envName = isDev ? '.env.dev' : '.env.prod';

  console.log('envName', envName);
  console.log('env.MODE', env.MODE);
  console.log('mode', mode);

  return {
    mode: env.MODE,
    entry: path.resolve(__dirname, '../index.web.js'),
    ...(isDev ? {devtool: 'source-map'} : {}),
    output: {
      path: path.resolve(rootDir, 'dist'),
      filename: 'app-[fullhash].bundle.js',
      publicPath: '/',
      clean: true,
    },
    module: {
      rules: RULES,
    },
    devServer: {
      historyApiFallback: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.html'),
        filename: 'index.html',
        hash: true,
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || `${env.MODE}`),
        __DEV__: isDev,
      }),
    ],
    resolve: {
      extensions: ['.web.jsx', '.web.js', '.jsx', '.js'],
      alias: Object.assign({
        'react-native$': 'react-native-web',
        'react-native-localization': 'react-localization',
        'react-native-fs': path.join(rootDir, './src/components/ReactFileSystem/ReactNativeFS.web.js'),
        'react-native-view-shot': 'react-native-view-shot-with-web-support',
        'react-native-pdf-lib': 'pdf-lib',
        'react-native-webview': 'react-native-web-webview',
        '@dashdoc/react-native-system-sounds': path.join(
          rootDir,
          './src/components/@dashdoc/react-native-system-sounds/index.web.js',
        ),
        'react-native-code-push': path.join(rootDir, './src/components/CodePush/index.web.js'),
      }),
    },
  };
};
