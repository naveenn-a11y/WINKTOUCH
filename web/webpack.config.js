const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RULES = require('./webpack.rules');
const fs = require('fs');
const dotenv = require('dotenv');

const rootDir = path.join(__dirname, '..');

module.exports = (env, mode) => {
  const isCICD = process.env.CI === 'true';

  let envVars = {};

  if (isCICD) {
    envVars = {
      'process.env.WINK_APP_ENV': JSON.stringify(process.env.WINK_APP_ENV),
      'process.env.WINK_APP_HOST': JSON.stringify(process.env.WINK_APP_HOST),
      'process.env.WINK_APP_WEB_SOCKET_URL': JSON.stringify(process.env.WINK_APP_WEB_SOCKET_URL),
      'process.env.WINK_APP_REST_URL': JSON.stringify(process.env.WINK_APP_REST_URL),
      'process.env.WINK_APP_PUBLIC_IP': JSON.stringify(process.env.WINK_APP_PUBLIC_IP),
      'process.env.WINK_APP_WSS_CHAT_URL': JSON.stringify(process.env.WINK_APP_WSS_CHAT_URL),
      'process.env.WINK_APP_EMR_HOST_REST_URL': JSON.stringify(process.env.WINK_APP_EMR_HOST_REST_URL),
      'process.env.WINK_APP_ECOMM_URL': JSON.stringify(process.env.WINK_APP_ECOMM_URL),
      'process.env.WINK_APP_ACCOUNTS_URL': JSON.stringify(process.env.WINK_APP_ACCOUNTS_URL),
    };
  } else {
    const envFile = '.env';
    const envPath = path.resolve(__dirname, `../${envFile}`);
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      for (const k in envConfig) {
        envVars[`process.env.${k}`] = JSON.stringify(envConfig[k]);
      }
    }
  }

  const outputPath = path.resolve(rootDir, 'dist');

  const versionFilePath = path.resolve(__dirname, '../js/Version.js');
  const versionFileContent = fs.readFileSync(versionFilePath, 'utf8');
  const versionMatch = /EHR_VERSION_NUMBER\s*=\s*['"]([^'"]+)['"]/.exec(versionFileContent);
  const versionNumber = versionMatch ? versionMatch[1] : 'unknown';

  try {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
      console.log('Output directory has been created.');
    }
  } catch (error) {
    console.error(`Unable to create the output directory. Please create it manually at: ${outputPath}`);
    process.exit(1);
  }

  if (fs.existsSync(outputPath)) {
    console.log('The output directory exists and version.xml will be updated.');
    fs.writeFileSync(path.resolve(rootDir, 'dist/version.xml'), `<version>${versionNumber}</version>`);
  }

  console.log('versionNumber', versionNumber);
  console.log('mode', mode);
  console.log('envVars', envVars);

  const isDev = envVars['process.env.WINK_APP_ENV'] !== 'production';

  return {
    mode: mode || 'development',
    entry: path.resolve(__dirname, '../index.web.js'),
    ...(isDev ? { devtool: 'source-map' } : {}),
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
        ...envVars,
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
          './src/components/@dashdoc/react-native-system-sounds/index.web.js'
        ),
        'react-native-code-push': path.join(rootDir, './src/components/CodePush/index.web.js'),
      },
    },
  };
};
