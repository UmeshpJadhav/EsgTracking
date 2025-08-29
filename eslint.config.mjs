import { dirname } from "path";
import { fileURLToPath } from "url";
import { fixupConfigRules } from "@eslint/compat";
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import globals from "globals";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isCI = process.env.CI === 'true';

const eslintConfig = [
  ...[
    { ignores: [".next/**", "node_modules/**", "src/generated/**", "src/generated/prisma/**"] },
    {
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
          React: "readonly",
          JSX: "readonly",
        },
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
          ecmaFeatures: {
            jsx: true,
          },
          project: "./tsconfig.json",
        },
      },
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ["**/*.ts", "**/*.tsx"],
      plugins: {
        "@typescript-eslint": tseslint.plugin,
      },
      rules: {
        ...tseslint.configs.recommended.rules,
        ...reactRecommended.rules,
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": isCI ? "off" : "warn",
        "@typescript-eslint/no-empty-object-type": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/ban-ts-comment": "off",
      },
    },
    {
      files: ["**/*.tsx"],
      plugins: {
        "@next/next": nextPlugin,
      },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs[`core-web-vitals`].rules,
        "@next/next/no-html-link-for-pages": "off",
      },
    },
  ],
];

export default eslintConfig;
