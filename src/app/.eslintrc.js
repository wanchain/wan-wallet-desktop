module.exports = {
  root: true,
  extends: 'standard',
  parser: 'babel-eslint',
  plugins: [
    'react'
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    'no-unused-vars': 0,
    'indent': 0,
    'semi': 0,
    'prefer-const': 0,
    'comma-dangle': 0,
    'no-unexpected-multiline': 0,
    'func-call-spacing': 0,
    'camelcase': 0,
    'no-useless-escape': 0
  },
  globals: {
    wand: "readonly",
  }
};