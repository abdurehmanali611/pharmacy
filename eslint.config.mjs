import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This rule is too strict for common, safe patterns used across the app (and in 3rd-party UI hooks).
      "react-hooks/set-state-in-effect": "off",
      // React Compiler informational warnings; not actionable for this app right now.
      "react-hooks/incompatible-library": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific (avoid linting backend + dependencies):
    "BackEnd/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
