import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Marketplace money discipline (eng review CQ3 lint gate):
  // Block construction of `new Number(...)` and parseFloat/parseInt on
  // identifiers ending in `_sar` or named `askPrice*`/`pricePerShare`/
  // `sharesOffered`. Force Dec usage end-to-end on money fields.
  {
    files: ["app/(app)/marketplace/**/*.{ts,tsx}", "lib/marketplace/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='parseFloat'][arguments.0.type='Identifier'][arguments.0.name=/.*[Ss]ar$|^askPrice|^pricePerShare|^sharesOffered/]",
          message:
            "Money fields must stay as strings and use Dec for math. parseFloat loses precision.",
        },
        {
          selector:
            "CallExpression[callee.name='parseInt'][arguments.0.type='Identifier'][arguments.0.name=/.*[Ss]ar$|^askPrice|^pricePerShare|^sharesOffered/]",
          message:
            "Money fields must stay as strings and use Dec for math. parseInt loses precision.",
        },
        {
          selector:
            "NewExpression[callee.name='Number'][arguments.0.type='Identifier'][arguments.0.name=/.*[Ss]ar$|^askPrice|^pricePerShare|^sharesOffered/]",
          message:
            "Money fields must stay as strings and use Dec for math. `new Number(x)` is unsafe.",
        },
      ],
    },
  },
]);

export default eslintConfig;
