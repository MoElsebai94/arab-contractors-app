/**
 * ESLint Configuration for Node.js Server
 */
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script'
  },
  rules: {
    // General JavaScript rules
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    'no-console': 'off', // Allow console in server code
    'no-debugger': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'curly': ['error', 'multi-line'],
    'no-duplicate-imports': 'error',

    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-prototype-builtins': 'warn',

    // Node.js specific
    'no-process-exit': 'warn',
    'no-path-concat': 'error',
    'callback-return': 'warn',
    'handle-callback-err': 'warn',

    // Async/Promise handling
    'no-async-promise-executor': 'error',
    'no-await-in-loop': 'warn',
    'require-await': 'warn',

    // Code quality
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error'
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
        mocha: true
      }
    }
  ]
};
