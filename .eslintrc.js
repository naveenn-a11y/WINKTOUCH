module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    "react-native/no-inline-styles": "off",
    'prettier/prettier': 'off',
    'eqeqeq': 'off',
    'react/no-string-refs': 'off',
    "no-alert": "off",
    'no-eval': 'off',
    "radix": "off",
  },
};
