const path = require('path');
const rootDir = path.join(__dirname, '..');

module.exports = [
  {
    test: /\.(jsx|js|mjs)$/,
    include: [
      path.resolve(rootDir, './index.web.js'),
      path.resolve(rootDir, './js/Index.js'),
      path.resolve(rootDir, './src'),
      path.resolve(rootDir, './js'),
      path.resolve(rootDir, './node_modules/react-native-a-beep'),
      path.resolve(rootDir, './node_modules/react-native-calendar'),
      path.resolve(rootDir, './node_modules/react-native-fs'),
      path.resolve(rootDir, './node_modules/react-localization'),
      path.resolve(rootDir, './node_modules/react-native-vector-icons'),
      path.resolve(
        rootDir,
        './node_modules/react-native-keyboard-aware-scroll-view',
      ),
      path.resolve(rootDir, './node_modules/react-native-view-shot'),
      path.resolve(rootDir, './node_modules/react-navigation-stack'),
      path.resolve(rootDir, './node_modules/react-native-gesture-handler'),
      path.resolve(rootDir, './node_modules/react-native-screens'),
      path.resolve(rootDir, './node_modules/react-native-webview'),
      path.resolve(rootDir, './node_modules/react-native-document-scanner'),
      path.resolve(rootDir, './node_modules/react-native-pdf'),
      path.resolve(rootDir, './node_modules/react-native-pdf-lib'),
      path.resolve(rootDir, './node_modules/rn-fetch-blob'),
      path.resolve(rootDir, './node_modules/native-base'),
      path.resolve(rootDir, './node_modules/react-native-easy-grid'),
      path.resolve(rootDir, './node_modules/@codler'),
      path.resolve(rootDir, './node_modules/react-native-drawer'),
      path.resolve(rootDir, './node_modules/react-native-code-push'),

    ],
    loader: 'babel-loader',
    options: {
      presets: ['module:metro-react-native-babel-preset'],
      plugins: ['react-native-web'],
    },
  },
  {
    test: /\.(gif|jpe?g|png|svg|ttf)$/,
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
      esModule: false,
    },
  },
  {
    test: /\.css$/i,
    use: ['style-loader', 'css-loader'],
  },
  {
    test: /\.html$/,
    loader: 'html-loader',
  },
];
