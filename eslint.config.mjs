import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const browserFiles = ["apps/web/**/*.{ts,tsx}", "packages/ui/**/*.{ts,tsx}"];
const reactRefreshFiles = ["apps/web/src/**/*.{ts,tsx}"];
const nodeFiles = [
  "apps/api/**/*.ts",
  "apps/gateway/**/*.ts",
  "apps/worker/**/*.ts",
  "packages/config/**/*.ts",
  "packages/database/**/*.ts",
  "packages/sdk/**/*.ts",
  "scripts/**/*.ts"
];

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      ".turbo/**",
      "coverage/**",
      "programs/**/target/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ]
    }
  },
  {
    files: browserFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024
      }
    },
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules
    }
  },
  {
    files: reactRefreshFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024
      }
    },
    plugins: {
      "react-refresh": reactRefresh
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        {
          "allowConstantExport": true
        }
      ]
    }
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024
      }
    }
  },
  prettier
);
