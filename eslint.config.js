import { configApp } from '@adonisjs/eslint-config'

export default configApp({
  rules: {
    'prettier/prettier': 'off',
    'nonblock-statement-body-position': ['error', 'below'],
    'curly': ['error', 'multi'],
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'object-curly-spacing': ['error', 'always'],
    'no-console': 'error'
  },
})
