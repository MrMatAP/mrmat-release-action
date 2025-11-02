import globals from 'globals'
import tseslint from 'typescript-eslint'
import tsParser from '@typescript-eslint/parser'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config'
import js from '@eslint/js'

export default defineConfig([
    // Ignore generated files
    { ignores: ['dist/**', 'rollup.config.js'] },

    // Base recommended configs
    js.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    tseslint.configs.recommendedTypeChecked,

    // Project rules
    {
        files: [
            'src/**/*.{js,mjs,cjs,ts,mts,cts}',
            '__fixtures__/**/*.ts',
            '__tests__/**/*.ts',
            'jest.config.ts',
            'eslint.config.ts'
        ],
        plugins: {
            '@stylistic': stylistic
        },
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest
            },
            parser: tsParser,
            ecmaVersion: 2023,
            sourceType: 'module',
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
                project: ['./tsconfig.json']
            }
        },
        rules: {
            '@stylistic/indent': ['error', 4],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],
            '@stylistic/array-bracket-newline': ['error', 'consistent'],
            '@stylistic/array-element-newline': ['error', 'consistent'],
            '@stylistic/arrow-parens': ['warn', 'as-needed'],
            '@stylistic/arrow-spacing': [
                'error',
                { before: true, after: true }
            ],
            '@stylistic/block-spacing': ['error', 'always'],
            '@stylistic/brace-style': [
                'error',
                '1tbs',
                { allowSingleLine: true }
            ],
            eqeqeq: ['error', 'always'],
            'eol-last': ['error', 'always']
        }
    }
])
