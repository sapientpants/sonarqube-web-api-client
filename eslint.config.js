import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['PascalCase'],
        },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
      '@typescript-eslint/member-ordering': ['error', {
        default: [
          // Index signature
          'signature',
          'call-signature',

          // Fields
          'public-static-field',
          'protected-static-field',
          'private-static-field',
          '#private-static-field',

          'public-decorated-field',
          'protected-decorated-field',
          'private-decorated-field',

          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',
          '#private-instance-field',

          'public-abstract-field',
          'protected-abstract-field',

          'public-field',
          'protected-field',
          'private-field',
          '#private-field',

          'static-field',
          'instance-field',
          'abstract-field',

          'decorated-field',

          'field',

          // Static initialization
          'static-initialization',

          // Constructors
          'public-constructor',
          'protected-constructor',
          'private-constructor',

          'constructor',

          // Getters
          'public-static-get',
          'protected-static-get',
          'private-static-get',
          '#private-static-get',

          'public-decorated-get',
          'protected-decorated-get',
          'private-decorated-get',

          'public-instance-get',
          'protected-instance-get',
          'private-instance-get',
          '#private-instance-get',

          'public-abstract-get',
          'protected-abstract-get',

          'public-get',
          'protected-get',
          'private-get',
          '#private-get',

          'static-get',
          'instance-get',
          'abstract-get',

          'decorated-get',

          'get',

          // Setters
          'public-static-set',
          'protected-static-set',
          'private-static-set',
          '#private-static-set',

          'public-decorated-set',
          'protected-decorated-set',
          'private-decorated-set',

          'public-instance-set',
          'protected-instance-set',
          'private-instance-set',
          '#private-instance-set',

          'public-abstract-set',
          'protected-abstract-set',

          'public-set',
          'protected-set',
          'private-set',
          '#private-set',

          'static-set',
          'instance-set',
          'abstract-set',

          'decorated-set',

          'set',

          // Methods - non-decorated first, then decorated
          'public-static-method',
          'protected-static-method',
          'private-static-method',
          '#private-static-method',

          'public-instance-method',
          'protected-instance-method',
          'private-instance-method',
          '#private-instance-method',

          'public-abstract-method',
          'protected-abstract-method',

          'public-method',
          'protected-method',
          'private-method',
          '#private-method',

          // Decorated methods (including @Deprecated) come after non-decorated
          'public-decorated-method',
          'protected-decorated-method',
          'private-decorated-method',

          'static-method',
          'instance-method',
          'abstract-method',

          'decorated-method',

          'method',
        ],
      }],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-dynamic-delete': 'error',
      '@typescript-eslint/no-invalid-void-type': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/prefer-regexp-exec': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'no-param-reassign': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': 'error',
      'prefer-destructuring': ['error', { array: false, object: true }],
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'src/test-utils/**/*.ts'],
    rules: {
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/naming-convention': ['error', {
        selector: 'objectLiteralProperty',
        modifiers: ['requiresQuotes'],
        format: null,
      }],
    },
  },
  {
    files: ['src/resources/**/*.ts'],
    rules: {
      // Allow @Deprecated decorator usage which triggers deprecation warnings
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
  {
    files: ['src/resources/**/__tests__/*.test.ts'],
    rules: {
      // Allow testing deprecated methods
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
  {
    files: ['src/core/utils/v2-query-builder.ts'],
    rules: {
      // Allow console.warn for parameter skipping warnings
      'no-console': ['error', { allow: ['warn'] }],
    },
  },
  {
    files: ['src/core/deprecation/**/*.ts', 'src/core/deprecation/**/*.test.ts'],
    rules: {
      // Type safety relaxations needed for dynamic proxy and decorator patterns
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-deprecated': 'off', // Allow testing deprecated features
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'], // Allow PascalCase for decorators
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      
      // Other rules
      'no-console': 'off', // Needed for deprecation warnings
      'no-duplicate-imports': 'off',
      'curly': 'off',
    },
  },
  {
    ignores: ['dist/', 'coverage/', 'node_modules/', '*.config.js', '*.config.ts'],
  }
);