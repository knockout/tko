const pluginJs = require('@eslint/js')
const tseslint = require('typescript-eslint')


/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  { ignores: ['**/*.{js,mjs,cjs}', 'builds/**/*', '**/*.d.ts'] },
  {
    rules: {
      "no-empty": "off",
      "prefer-rest-params" : "off",
      "prefer-spread": "off",
      "prefer-const": "off",
      "no-useless-escape": "off",
      "no-useless-assignment": "off",
//    "no-var": "off",
      'no-array-constructor': 'off',
      'no-misleading-character-class': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-array-constructor': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off'
    }
  }
]
