// @ts-check
/**
 * Lint config for RicoChart (`rico-chart`).
 *
 * 1. Ordinary correctness rules over TypeScript.
 * 2. The TIER ACL: ensures the base tier never reaches into a lazy tier,
 *    and the widget tier reaches shared state via `rico-chart` specifiers.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const LAZY_TIERS = ['draw', 'transform', 'profile', 'webgl', 'widget', 'workspace'];

const BASE_DIRS = [
  'core', 'render', 'scale', 'model', 'primitives',
  'input', 'feed', 'replay', 'compare', 'link', 'helpers', 'alerts',
];

const crossTier = (tiers, why) => ({
  patterns: tiers.map((t) => ({
    group: [`**/${t}/**`, `../${t}/*`, `../../${t}/*`, `./${t}/*`],
    message: why,
  })),
});

export default tseslint.config(
  { ignores: ['dist/**', 'dist-baseline/**', 'node_modules/**', 'coverage/**', '.worktrees/**', 'artifacts/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': 'error',
    },
  },

  // ── the tier ACL ────────────────────────────────────────────────────────────
  {
    files: BASE_DIRS.map((d) => `src/${d}/**/*.ts`),
    rules: {
      'no-restricted-imports': [
        'error',
        crossTier(
          LAZY_TIERS,
          'Base tier must not import a lazy tier: it pulls that whole bundle into rico-chart.mjs. ' +
            'Invert the dependency (register into a base registry from the tier) instead.',
        ),
      ],
    },
  },

  {
    files: LAZY_TIERS.filter((t) => t !== 'widget').map((t) => `src/${t}/**/*.ts`),
    rules: {
      'no-restricted-imports': [
        'error',
        crossTier(
          ['widget'],
          'Only a host imports the widget tier. A tier that needs UI describes it (a settings schema, an event) and lets the widget render it.',
        ),
      ],
    },
  },

  {
    files: ['src/widget/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...LAZY_TIERS.filter((t) => t !== 'widget').map((t) => ({
              group: [`**/${t}/**`, `../${t}/*`, `../../${t}/*`],
              message: `Import the ${t} tier as 'rico-chart/${t}': a relative path inlines a second copy of it into the widget bundle.`,
            })),
            {
              group: ['**/core/**', '../core/*', '../../core/*', '../index', '../index.ts', '../all', '../all.ts'],
              message: "Import Chart, createChart and the option types from 'rico-chart': a relative path inlines a second Chart class into the widget bundle.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.cjs', '**/*.mjs', '*.config.js'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },

  {
    files: ['tests/**/*.ts', 'tests/**/*.cjs', '*.config.ts', '*.config.js'],
    rules: {
      'no-console': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
);
