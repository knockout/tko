import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  { ignores: ['**/*.{js,mjs,cjs}'] },
  {
    rules: {
      "no-empty": "off",
      "prefer-rest-params" : "off",
      "prefer-spread": "off",
      "no-useless-escape": "off",
      "no-var": "off",
      "no-array-constructor": "off",
      "@typescript-eslint/no-array-constructor": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars" : "off"
    }
  }
];