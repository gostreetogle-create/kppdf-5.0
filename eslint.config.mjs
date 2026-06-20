import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "no-restricted-syntax": [
        "error",
        // Direct member access: process.env.NODE_ENV
        {
          selector:
            "MemberExpression[property.name='NODE_ENV'][object.property.name='env'][object.object.name='process']",
          message:
            "Use `isProd`/`isDev` from '@/lib/env' instead of direct process.env.NODE_ENV access.",
        },
        // Computed member access: process.env['NODE_ENV']
        {
          selector:
            "MemberExpression[computed=true][property.value='NODE_ENV'][object.property.name='env'][object.object.name='process']",
          message:
            "Use `isProd`/`isDev` from '@/lib/env' instead of direct process.env['NODE_ENV'] access.",
        },
        // Direct member access: process.env.NEXT_PUBLIC_BASE_URL
        {
          selector:
            "MemberExpression[property.name='NEXT_PUBLIC_BASE_URL']",
          message:
            "Use `baseUrl` from '@/lib/env' instead of direct process.env.NEXT_PUBLIC_BASE_URL access.",
        },
        // Computed member access: process.env['NEXT_PUBLIC_BASE_URL']
        {
          selector:
            "MemberExpression[computed=true][property.value='NEXT_PUBLIC_BASE_URL']",
          message:
            "Use `baseUrl` from '@/lib/env' instead of direct process.env['NEXT_PUBLIC_BASE_URL'] access.",
        },
      ],
    },
  },
  // Override: src/lib/env.ts is the only file allowed to access process.env
  // directly (it's the source of truth for isProd/isDev/baseUrl).
  {
    files: ['src/lib/env.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);

export default eslintConfig;
