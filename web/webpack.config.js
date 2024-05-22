const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RULES = require('./webpack.rules');
const fs = require('fs');
const dotenv = require('dotenv');

const rootDir = path.join(__dirname, '..');

module.exports = (env, mode) => {
  const envFile = '.env.active'; // always use .env.active
  const envPath = path.resolve(__dirname, `../${envFile}`);
  const envVars = dotenv.config({ path: envPath }).parsed;

  const outputPath = path.resolve(rootDir, 'dist');

  const versionFilePath = path.resolve(__dirname, '../js/version.js');
  const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
  const versionMatch = /EHR_VERSION_NUMBER\s*=\s*['"]([^'"]+)['"]/.exec(versionFileContent);
  const versionNumber = versionMatch ? versionMatch[1] : 'unknown';

  try {
    // Check if the directory exists, if not, create it
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
      console.log('Output directory has been created.');
    }
  } catch (error) {
    // If an error occurs, log the message and exit
    console.error(`Unable to create the output directory. Please create it manually at: ${outputPath}`);
    process.exit(1); // Exit the process with an error code
  }

  if (fs.existsSync(outputPath)) {
    console.log('The output directory exists and version.xml will be updated.')
    fs.writeFileSync(path.resolve(rootDir, 'dist/version.xml'), `<version>${versionNumber}</version>`);
  }

  console.log('versionNumber', versionNumber);
  console.log('mode', mode);
  console.log('envPath', envPath);
  console.log('envVars', envVars);

  // read WINK_APP_ENV from .env file to determine if we are in dev mode
  // set isDev to true if WINK_APP_ENV is not production
  const isDev = envVars.WINK_APP_ENV !== 'production';

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
    ],
    resolve: {
      extensions: ['.web.jsx', '.web.js', '.jsx', '.js'],
      alias: {
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
        'react-native-code-push': path.join(rootDir, './src/components/CodePush/index.web.js'),},
    },
  };
};
