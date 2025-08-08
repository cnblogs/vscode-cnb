import eslintJS from "@eslint/js"
import tsEslint from "typescript-eslint"

export default tsEslint.config({
    files: ["**/*.ts"],
    ignores: [
        "**/rs",
        "**/out",
        "**/pkg",
        "**/dist",
        "**/*.d.ts",
        "src/test/**/*",
        "src/wasm/**/*",
        "src/assets/**/*",
        "__mocks__/vscode.ts",
    ],
    languageOptions: {
        parserOptions: {
            project: true,
            tsconfigRootDir: import.meta.dirname,
        },
    },
    extends: [
        eslintJS.configs.recommended,
        ...tsEslint.configs.recommended,
        ...tsEslint.configs.stylistic,
    ],
    rules: {
        "@typescript-eslint/explicit-member-accessibility": [
            "off",
            {
                accessibility: "explicit",
            },
        ],
        "arrow-parens": ["off", "always"],
        "import/order": "off",
        "@typescript-eslint/member-ordering": "off",
        "no-underscore-dangle": "off",
        "@typescript-eslint/naming-convention": "off",
        "jsdoc/newline-after-description": 0,
        "@typescript-eslint/consistent-indexed-object-style": "off",
        "@typescript-eslint/array-type": "off",
        "no-extra-boolean-cast": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "no-case-declarations": "off",
        "no-prototype-builtins": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
        "@typescript-eslint/adjacent-overload-signatures": "off",
    },
})
