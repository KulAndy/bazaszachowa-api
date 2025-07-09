import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      js,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,

      "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
      "prefer-const": "error",
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "linebreak-style": ["error", "unix"],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
      "no-console": ["warn", { allow: ["error", "info"] }],
      curly: ["error", "all"],
      "no-var": "error",
      "prefer-arrow-callback": "warn",
      "no-duplicate-imports": "error",
      "no-use-before-define": ["error", { functions: false, classes: true }],
      "no-empty": "warn",
      "no-extra-semi": "error",
      "no-extra-boolean-cast": "warn",
      "no-dupe-keys": "error",
      "no-implied-eval": "error",
      "no-new-wrappers": "error",
      "array-callback-return": "error",
      "for-direction": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": ["error", "always"],
      "no-debugger": "error",
      "no-dupe-else-if": "error",
      "no-duplicate-case": "error",
      "no-irregular-whitespace": "error",
      "no-self-compare": "error",
      "no-sparse-arrays": "error",
      "no-template-curly-in-string": "error",
      "no-unexpected-multiline": "error",
      "no-unmodified-loop-condition": "error",
      complexity: ["error", 50],
      "max-nested-callbacks": ["error", 10],
      "no-lonely-if": "error",
      "no-negated-condition": "error",
      yoda: ["error", "never"],
    },
  },
]);
