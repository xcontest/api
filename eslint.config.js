/*
 *          ______            __            __
 *    _  __/ ____/___  ____  / /____  _____/ /_
 *   | |/_/ /   / __ \/ __ \/ __/ _ \/ ___/ __/
 *  _>  </ /___/ /_/ / / / / /_/  __(__  ) /_
 * /_/|_|\____/\____/_/ /_/\__/\___/____/\__/
 *     Copyright (C) 2026 xContest Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 *
 */

import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {configApp} from '@adonisjs/eslint-config'
import tseslint from 'typescript-eslint'

// TODO: Enable when compatible with eslint 10
// import importPlugin from 'eslint-plugin-import'

function getCopyrightFromIdea() {
  try {
    const xmlPath = join(import.meta.dirname, '.idea/copyright/AGPLv3_xContest.xml')
    const xmlContent = readFileSync(xmlPath, 'utf-8')

    // Extract the content inside the 'notice' value
    const match = xmlContent.match(/<option name="notice" value="([\s\S]*?)"\s*\/>/)
    if (!match) return null

    const notice = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#10;/g, '\n')
      .replace(/&#36;/g, '$')
      .replace(/\$today\.year/g, new Date().getFullYear().toString())
    return notice
  } catch (e) {
    return null
  }
}

const copyrightNotice = getCopyrightFromIdea()

const copyrightRule = {
  meta: {
    type: 'layout',
    docs: { description: 'Enforce copyright header' },
    fixable: 'prepend',
  },
  create(context) {
    return {
      Program(node) {
        const sourceCode = context.sourceCode
        const firstComment = sourceCode.getAllComments()[0]

        const hasCopyright = /Copyright \(C\) \d{4}/.test(firstComment?.value || '')

        if (!hasCopyright) {
          context.report({
            node,
            message: 'Missing mandatory Copyright header at the top of the file.',
            fix(fixer) {
              const header = `/*\n${copyrightNotice
                .split('\n')
                .map((line) => ` * ${line}`)
                .join('\n')}\n */\n\n`
              return fixer.insertTextBefore(node, header)
            },
          })
        }
      },
    }
  },
}

export default configApp([
  {
    languageOptions: {
      parserOptions: {
        projectService: true, // This is the modern way in v8+ to handle type info
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      // import: importPlugin,
    },
    rules: {
      'prettier/prettier': 'off',
      'curly': ['error', 'multi'],
      'arrow-body-style': ['error', 'as-needed'],
      'no-return-await': 'off',

      '@stylistic/nonblock-statement-body-position': ['error', 'below'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/dot-location': ['error', 'property'],
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/operator-linebreak': ['error', 'before'],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/no-whitespace-before-property': 'error',
      '@stylistic/padded-blocks': ['error', 'never'],
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
          catch: 'always',
        },
      ],

      'no-console': 'error',
      'prefer-const': 'error',

      '@typescript-eslint/no-unused-vars': [
        // no-unused-vars, but allows in declarations
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          ignoreUsingDeclarations: true,
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/return-await': 'error',

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
  {
    files: ['ace.js', '*/**.js', 'eslint.config.mjs', 'adonisrc.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/return-await': 'off',
    },
  },
  {
    plugins: {
      local: { rules: { 'copyright-header': copyrightRule } },
    },
    files: ['app/**/*.ts', 'config/**/*.ts', 'database/**/*.ts', 'start/**/*.ts', 'tests/**/*.ts'],
    ignores: ['database/schema.ts'],
    rules: {
      'local/copyright-header': 'error',
    },
  },
])
