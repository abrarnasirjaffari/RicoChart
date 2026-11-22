// @ts-check
/**
 * Workspace-level ESLint config for RicoChart trading & event packages.
 * `packages/chart` runs its own dedicated tier-ACL lint config via `packages/chart/eslint.config.js`.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'packages/chart/**',
      '**/dist/**',
      '**/dist-baseline/**',
      'node_modules/**',
      'coverage/**',
      '.worktrees/**',
      'artifacts/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['packages/*/src/**/*.ts'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': 'error',
    },
  },

  // Hard architectural boundary: pure-code execution engine must NEVER import AI modules.
  {
    files: ['packages/execution/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/ai/**', '@rico-chart/ai*', '*openai*', '*anthropic*', '*generative-ai*'],
              message: 'Execution engine is pure deterministic code — AI imports are forbidden.',
            },
          ],
        },
      ],
    },
  },

  // Hard architectural boundary: no-look-ahead backtester must not import live paper-trading or live connectors.
  {
    files: ['packages/backtest/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/paper-trading/**', '@rico-chart/paper-trading*', '**/connectors/**', '@rico-chart/connectors*'],
              message: 'Backtester must remain strictly causal and isolated from live trading/feed modules.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['packages/*/tests/**/*.ts', 'packages/*/vitest.config.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
