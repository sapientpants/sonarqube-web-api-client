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
        project: ['./tsconfig.json', './tsconfig.tests.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
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
        {
          // Allow any format for type properties (external API responses)
          selector: 'typeProperty',
          format: null,
        },
        {
          // Allow any format for object literal properties that require quotes
          selector: 'objectLiteralProperty',
          modifiers: ['requiresQuotes'],
          format: null,
        },
        {
          // Allow PascalCase for object literal properties (HTTP headers like Accept, Content-Type)
          selector: 'objectLiteralProperty',
          format: ['camelCase', 'PascalCase'],
        },
        {
          // Allow PascalCase for functions (used for mixins like DownloadMixin)
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
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
      '@typescript-eslint/member-ordering': [
        'error',
        {
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
        },
      ],
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
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
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
    files: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/__tests__/**/*.ts',
      'src/test-utils/**/*.ts',
      'src/__integration__/**/*.ts',
      'tests/**/*.ts', // Include all test files in tests/ directory
    ],
    rules: {
      // Relax type safety rules for test files
      '@typescript-eslint/ban-ts-comment': 'off', // Allow @ts-nocheck for test files
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-conversion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in test files
      '@typescript-eslint/no-unsafe-enum-comparison': 'off', // Allow enum comparisons in tests
      '@typescript-eslint/switch-exhaustiveness-check': 'off', // Allow non-exhaustive switches in tests
      '@typescript-eslint/member-ordering': 'off', // Allow flexible member ordering in test classes
      '@typescript-eslint/no-extraneous-class': 'off', // Allow test helper classes
      '@typescript-eslint/no-empty-object-type': 'off', // Allow empty interfaces for type extensions in tests
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^Mock$',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'objectLiteralProperty',
          modifiers: ['requiresQuotes'],
          format: null,
        },
        {
          // Allow any format for object literal properties (like 'users.search')
          selector: 'objectLiteralProperty',
          format: null,
        },
      ],
      'no-duplicate-imports': 'off',
      'no-console': 'off', // Allow console in tests
      'prefer-destructuring': 'off',
    },
  },
  {
    files: ['src/resources/**/*.ts'],
    rules: {
      // Allow @Deprecated decorator usage which triggers deprecation warnings
      '@typescript-eslint/no-deprecated': 'off',
      // Allow classes with only static methods (utility classes)
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    files: [
      'src/resources/**/builders.ts',
      'src/resources/**/buildersV2.ts',
      'src/resources/**/utils.ts',
      'src/resources/**/types.ts',
    ],
    rules: {
      // Builder classes have many chaining methods, disable member ordering
      '@typescript-eslint/member-ordering': 'off',
      // Builders and utils may have flexible signatures
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          // Allow UPPER_CASE for enum members (external API values)
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE'],
        },
        {
          // Allow snake_case for class properties (external API values)
          selector: 'classProperty',
          format: null,
        },
      ],
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
      // Query builder deals with dynamic parameters
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },
  {
    files: ['src/core/mixins/**/*.ts'],
    rules: {
      // Mixins deal with dynamic base classes and stream APIs
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['src/__integration__/**/*.ts'],
    rules: {
      // Type safety relaxations needed for integration tests with external APIs
      '@typescript-eslint/ban-ts-comment': 'off', // Allow @ts-nocheck for integration tests with dynamic API responses
      '@typescript-eslint/no-deprecated': 'off', // Allow testing deprecated APIs
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off', // Allow enum comparisons with external API responses
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-namespace': 'off', // Allow namespace for Jest matchers
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in test setup
      '@typescript-eslint/no-empty-object-type': 'off', // Allow empty interfaces for type extensions
      '@typescript-eslint/explicit-function-return-type': 'off', // Allow implicit returns in test setup
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Allow implicit returns
      'no-console': 'off', // Allow console logs for test output
      'prefer-destructuring': 'off', // Allow flexible destructuring patterns
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
        {
          // Allow any format for object literal properties (like 'users.search')
          selector: 'objectLiteralProperty',
          format: null,
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
      curly: 'off',
    },
  },
  {
    files: ['src/index.ts'],
    rules: {
      // Allow exporting deprecated types for backwards compatibility
      '@typescript-eslint/no-deprecated': 'off',
      // Disable member ordering for main client class (many resource clients)
      '@typescript-eslint/member-ordering': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'coverage/',
      'node_modules/',
      '*.config.js',
      '*.config.ts',
      'scripts/',
      '.claude/',
      '.github/scripts/',
    ],
  },
);
