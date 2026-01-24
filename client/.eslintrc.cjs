/**
 * ESLint Configuration for React Client
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['react', 'react-hooks', 'react-refresh'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // React specific rules
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ],
    'react/prop-types': 'off', // Using TypeScript or runtime validation instead
    'react/jsx-no-target-blank': 'error',
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'warn',
    'react/display-name': 'off',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // General JavaScript rules
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'curly': ['error', 'multi-line'],
    'no-duplicate-imports': 'error',

    // Code quality
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Accessibility reminders (for future a11y plugin)
    // These are placeholder comments - add eslint-plugin-jsx-a11y for full support

    // Security
    'no-prototype-builtins': 'warn'
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
      env: {
        jest: true
      }
    }
  ]
};
