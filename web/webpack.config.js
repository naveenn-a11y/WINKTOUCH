// module.exports = (env) => {
//   return require(`./webpack.${env.goal}.js`);
// };

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');
const RULES = require('./webpack.rules');
const fs = require('fs');
const dotenv = require('dotenv');

const rootDir = path.join(__dirname, '..');

module.exports = (env, mode) => {
  const envFile = env.ENV ? `.env.${env.ENV}` : '.env';
  const envPath = path.resolve(__dirname, `../envs/${envFile}`);
  const envVars = dotenv.config({ path: envPath }).parsed;

  const isDev = env.ENV !== 'prod';
  const envName = isDev ? '.env.dev' : '.env.prod';
  const versionNumber = process.env.WINK_VERSION || 'unknown'; // Use WINK_VERSION from .env or default to 'unknown'

  console.log('envPath', envPath);
  console.log('env.MODE', env.MODE);
  console.log('mode', mode);
  console.log('versionNumber', versionNumber);
  console.log('envVars', envVars);

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
        'process.env': JSON.stringify(process.env),
        __DEV__: JSON.stringify(isDev),
      }),
      new WebpackShellPluginNext({
        onBuildStart: {
          scripts: ['echo Starting...'],
          blocking: true,
          parallel: false,
        },
        onBuildEnd: {
          scripts: [`echo '<version>${versionNumber}</version>' > ./dist/version.xml`],
          blocking: false,
          parallel: true,
        },
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
