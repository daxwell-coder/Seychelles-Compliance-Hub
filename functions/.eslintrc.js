module.exports = {
  root: true,
  env: { es6: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  ignorePatterns: [
    'lib',
    'generated'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'off'
  }
};
