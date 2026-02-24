import { configApp } from '@adonisjs/eslint-config'
// TODO: Enable when compatible with eslint 10
// import importPlugin from 'eslint-plugin-import'

export default configApp([
  {
    plugins: {
      // import: importPlugin,
    },
    rules: {
      'prettier/prettier': 'off',
      'nonblock-statement-body-position': ['error', 'below'],
      'curly': ['error', 'multi'],
      'brace-style': ['error', '1tbs', { allowSingleLine: false }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'object-curly-spacing': ['error', 'always'],
      'no-console': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      '@typescript-eslint/no-unused-vars': [ // no-unused-vars, but allows in declarations
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          ignoreUsingDeclarations: true,
        },
      ],
      'prefer-const': 'error',

      // 'import/order': [
      //   'error',
      //   {
      //     'groups': ['builtin', 'external', ['internal', 'parent', 'sibling', 'index']],
      //     'pathGroups': [
      //       {
      //         pattern: '#*/**',
      //         group: 'internal',
      //       },
      //     ],
      //     'pathGroupsExcludedImportTypes': ['builtin'],
      //     'newlines-between': 'always',
      //     'alphabetize': { order: 'asc', caseInsensitive: true },
      //   },
      // ],
    },
  },
])
