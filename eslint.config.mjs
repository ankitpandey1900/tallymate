import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Project overrides
  {
    rules: {
      // This rule is overly strict for real-world apps (data fetching + UI state).
      "react-hooks/set-state-in-effect": "off",
      // This rule is noisy with common immutable patterns already used in React.
      "react-hooks/immutability": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Non-app scripts / assets:
    "rename.js",
  ]),
]);

export default eslintConfig;
