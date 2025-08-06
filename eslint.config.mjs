import { defineConfig, globalIgnores } from 'eslint/config'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
})

export default defineConfig([
    globalIgnores([
        '**/rs',
        '**/out',
        '**/pkg',
        '**/dist',
        '**/*.d.ts',
        'src/test/**/*',
        'src/wasm/**/*',
        'src/assets/**/*',
        '__mocks__/vscode.ts',
    ]),
    {
        extends: compat.extends('@cnblogs/typescript'),

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 6,
            sourceType: 'module',

            parserOptions: {
                project: ['./tsconfig.json', './ui/tsconfig.json', './test/tsconfig.json'],
            },
        },

        rules: {
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto',
                },
            ],

            '@typescript-eslint/strict-boolean-expressions': [
                'warn',
                {
                    allowString: false,
                    allowNumber: false,
                    allowNullableObject: false,
                    allowNullableBoolean: false,
                },
            ],
        },
    },
    {
        files: ['**/*.config.js'],

        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
])
