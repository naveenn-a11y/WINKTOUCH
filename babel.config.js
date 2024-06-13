module.exports = {
  presets: [
    ['module:metro-react-native-babel-preset', {useTransformReactJSXExperimental: false}],
  ],
  plugins: [
    ["module:react-native-dotenv", {
      "envName": "WINK_ENV",
      "path": '.env'
     }],
  ]
};
