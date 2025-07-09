import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginN from "eslint-plugin-n";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginPromise from "eslint-plugin-promise";
import eslintPluginSecurity from "eslint-plugin-security";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintPluginSonar from "eslint-plugin-sonarjs";
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
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      n: eslintPluginN,
      import: eslintPluginImport,
      promise: eslintPluginPromise,
      security: eslintPluginSecurity,
      unicorn: eslintPluginUnicorn,
      sonarjs: eslintPluginSonar,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...eslintPluginN.configs["recommended"].rules,
      "n/no-missing-import": "off",
      "n/no-unpublished-import": "off",
      "n/no-unsupported-features/es-syntax": "off",
      "import/order": [
        "warn",
        {
          groups: [
            ["builtin", "external"],
            "internal",
            ["parent", "sibling", "index"],
          ],
          "newlines-between": "always",
        },
      ],
      "import/no-unresolved": "off",
      "import/no-duplicates": "error",
      "promise/catch-or-return": "warn",
      "promise/no-return-wrap": "error",
      "security/detect-object-injection": "off",
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "unicorn/prefer-query-selector": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/throw-new-error": "error",
      "unicorn/no-array-for-each": "warn",
      "sonarjs/cognitive-complexity": ["warn", 200],
      "sonarjs/no-identical-functions": "warn",
      "sonarjs/no-nested-switch": "error",
      "sonarjs/no-small-switch": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": "allow-with-description" },
      ],
      "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-use-before-define": ["error", { functions: false, classes: true }],
      curly: ["error", "all"],
      "no-var": "error",
      "prefer-arrow-callback": "warn",
      "no-duplicate-imports": "error",
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
      complexity: ["warn", 64],
      "max-nested-callbacks": ["warn", 10],
      "no-lonely-if": "warn",
      "no-negated-condition": "warn",
      yoda: ["error", "never"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "linebreak-style": ["error", "unix"],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
    },
  },
]);
