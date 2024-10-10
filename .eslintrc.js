module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'prettier/prettier': 'off',
    'eqeqeq': 'off',
    'react/no-string-refs': 'off',
    'no-eval': 'off',
  },
};
