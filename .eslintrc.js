/**
 * ESLint configuration for depmanager
 * 
 * Copyright (c) 2024, depmanager contributors
 * 
 * This source code is licensed under the ISC license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'notice',
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.json',
    '*.md',
    'LICENSE',
  ],
  rules: {
    'notice/notice': [
      'error',
      {
        template: `/**
 * <%= description %>
 * 
 * Copyright (c) <%= YEAR %>, <%= NAME %>
 * 
 * This source code is licensed under the ISC license found in the
 * LICENSE file in the root directory of this source tree.
 */`,
        templateVars: {
          NAME: 'depmanager contributors',
          YEAR: '2024',
        },
        varRegexps: {
          NAME: /.*/,
          YEAR: /\d{4}/,
        },
      },
    ],
  },
};
