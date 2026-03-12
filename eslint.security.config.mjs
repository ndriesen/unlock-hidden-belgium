/**
 * Security-focused ESLint Configuration
 * Extends the base ESLint config with security rules
 */

import securityPlugin from 'eslint-plugin-security';
import globals from 'globals';

export default [
  // Base configuration
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/*.min.js',
    ],
  },

  // Security rules for TypeScript/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      security: securityPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Security plugin rules
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-new-buffer': 'error',

      // Additional security best practices
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Prevent sensitive data in URLs
      'no-script-url': 'error',

      // Restrict global usage
      'no-restricted-globals': ['error', 'isNaN', 'isFinite'],

      // Require strict mode
      'strict': ['error', 'function'],

      // Disallow console.log in production (can leak info)
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },

  // Security rules for JavaScript files
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      security: securityPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // Same security rules as above
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-new-buffer': 'error',

      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-restricted-globals': ['error', 'isNaN', 'isFinite'],
      'strict': ['error', 'function'],
    },
  },

  // Rules specifically for configuration files
  {
    files: ['**/scripts/**/*.{js,ts}'],
    rules: {
      // More strict for scripts that might handle sensitive data
      'security/detect-child-process': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'no-console': 'off',
    },
  },

  // Test files - relaxed rules
  {
    files: ['**/*.{test,spec}.{ts,tsx,js}'],
    rules: {
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-require': 'off',
    },
  },
];

