import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default defineConfig(
    {
        ignores: [
            '.worktrees/**',
            '.next/**',
            'dist/**',
            'dist-desktop/**',
            'coverage/**',
            'playwright-report/**',
            'src/platform/collaboration/database.types.ts',
            'src-tauri/gen/**',
            'src-tauri/target/**',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    reactHooks.configs.flat.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: { 'jsx-a11y': jsxA11y },
        rules: {
            ...jsxA11y.flatConfigs.recommended.rules,
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { fixStyle: 'inline-type-imports' },
            ],
            '@typescript-eslint/no-confusing-void-expression': 'off',
            '@typescript-eslint/no-deprecated': 'off',
            '@typescript-eslint/restrict-template-expressions': [
                'error',
                { allowNumber: true },
            ],
            '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
            'react-hooks/incompatible-library': 'off',
        },
    },
    {
        files: ['src/**/*.{test,browser.test}.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/require-await': 'off',
        },
    }
);
