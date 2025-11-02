// @ts-check
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import * as jsonc from 'eslint-plugin-jsonc';
import jsoncParser from 'jsonc-eslint-parser';
import sonarjs from 'eslint-plugin-sonarjs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Ignore patterns
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'sbom.cdx.json', 'reports/**'],
  },
  // Base configuration for all JS/TS files
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs['recommended'].rules,
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },
  // Type-aware rules for TypeScript source files (excluding test-utils)
  {
    files: ['src/**/*.ts'],
    ignores: ['src/test-utils/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      sonarjs,
    },
    rules: {
      ...tseslint.configs['recommended-type-checked'].rules,

      // Allow underscore-prefixed unused variables
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Core ESLint complexity rules
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 3],
      'max-lines-per-function': [
        'error',
        {
          max: 50,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'max-params': ['error', { max: 4 }],
      'max-statements': ['error', 15],
      'max-nested-callbacks': ['error', 3],

      // Cognitive complexity (SonarJS)
      'sonarjs/cognitive-complexity': ['error', 15],

      // Additional code quality rules from SonarJS
      'sonarjs/no-duplicate-string': ['error', { threshold: 2 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/prefer-immediate-return': 'error',
    },
  },
  // Relaxed complexity rules for test files
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        project: ['./tsconfig.tests.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      sonarjs,
    },
    rules: {
      ...tseslint.configs['recommended-type-checked'].rules,

      // Relaxed type safety for tests
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Relaxed complexity rules for tests
      // Test files can have larger describe blocks with many test cases
      complexity: ['error', 15],
      'max-lines-per-function': ['error', { max: 600, skipComments: true, skipBlankLines: true }],
      'sonarjs/cognitive-complexity': ['error', 20],
      'sonarjs/no-duplicate-string': 'off', // Allow duplicates in tests
      'no-console': 'off', // Allow console in tests
    },
  },
  // Relaxed rules for deprecation and compatibility code
  {
    files: ['src/core/deprecation/**/*.ts', 'src/core/compat*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      'no-console': 'warn', // Allow console for CLI tools
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  // JSON/JSONC/JSON5 linting configuration
  {
    files: ['**/*.json', '**/*.json5', '**/*.jsonc'],
    languageOptions: {
      parser: jsoncParser,
    },
    plugins: {
      jsonc,
    },
    rules: {
      ...jsonc.configs['recommended-with-json'].rules,
      'jsonc/sort-keys': 'off', // Keep keys in logical order, not alphabetical
      'jsonc/indent': ['error', 2], // Enforce 2-space indentation in JSON files
      'jsonc/key-spacing': 'error', // Enforce consistent spacing between keys and values
      'jsonc/comma-dangle': ['error', 'never'], // No trailing commas in JSON
      'jsonc/quotes': ['error', 'double'], // Enforce double quotes in JSON
      'jsonc/quote-props': ['error', 'always'], // Always quote property names
      'jsonc/no-comments': 'off', // Allow comments in JSONC files
    },
  },
  // Specific rules for package.json
  {
    files: ['**/package.json'],
    rules: {
      'jsonc/sort-keys': [
        'error',
        {
          pathPattern: '^$', // Root object
          order: [
            'name',
            'version',
            'description',
            'keywords',
            'author',
            'license',
            'repository',
            'bugs',
            'homepage',
            'private',
            'type',
            'main',
            'module',
            'exports',
            'files',
            'bin',
            'packageManager',
            'engines',
            'scripts',
            'lint-staged',
            'dependencies',
            'devDependencies',
            'peerDependencies',
            'optionalDependencies',
          ],
        },
      ],
    },
  },
  // Specific rules for tsconfig files
  {
    files: ['**/tsconfig*.json'],
    rules: {
      'jsonc/no-comments': 'off', // Allow comments in tsconfig files
    },
  },
  // Keep Prettier last
  eslintConfigPrettier,
];
