# Contributing to RicoChart

Contributors are very welcome! Whether you are fixing a bug, improving performance, adding tests, refining documentation, or building new charting and AI-perception capabilities, we appreciate your help making **RicoChart** better.

---

## AI-Assisted Contributions Policy

You are welcome to use AI coding assistants and agents when contributing to RicoChart—**however, only high-quality code is accepted.**

Every pull request is reviewed against the same engineering bar regardless of how it was written:

- **Understand every line you submit.** Do not open PRs with unreviewed, blindly pasted AI output. You should be able to explain why each change is necessary and how it works.
- **No bloat or generic boilerplate.** Keep diffs focused, minimal, idiomatic, and consistent with the surrounding architecture and style.
- **Verify thoroughly before opening a PR.** Run typecheck, lint, tests, and build locally—never rely on guesswork.
- **Prove your change with tests.** Bug fixes must include a regression test; new features must include thorough unit/integration tests.
- **Respect project boundaries.** Do not introduce runtime dependencies or third-party/external project references.

Low-effort or unverified PRs may be closed without review.

---

## Development Setup

Requirements: **Node.js >= 20**

```bash
npm install
```

### Common Commands

```bash
npm run typecheck   # Type-check src/ (strict) and tests/
npm run lint        # Run ESLint + tier boundary checks
npm test            # Run the Vitest test suite
npm run test:watch  # Run Vitest in watch mode
npm run build       # Build all ESM, standalone, and .d.ts bundles into dist/
```

---

## Architecture & Code Standards

1. **Zero runtime dependencies:** RicoChart packages stay dependency-free at runtime. Keep it that way.
2. **Respect package & tier boundaries:**
   - `packages/chart/eslint.config.js` enforces the chart engine tier ACL (base tier never imports lazy tiers; `src/widget` imports shared state via `rico-chart` specifiers).
   - Root `eslint.config.js` enforces trading platform boundaries:
     - `packages/execution` is **pure deterministic code** and must never import AI modules.
     - `packages/backtest` must remain strictly **no-look-ahead / causal** and never import live paper-trading or live connectors.
3. **Strict TypeScript:**
   - All `packages/*/src/` code compiles with strict settings including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
   - `packages/chart/tests/tsconfig.json` intentionally disables only `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` for chart test ergonomics (`packages/chart/tests/typecheck-config.test.ts` guards this).
4. **No `any` or `console.*` in `src/`:** ESLint forbids `@typescript-eslint/no-explicit-any` and `no-console` in production source files.
5. **RicoChart branding only:** Keep all identifiers, CSS prefixes (`.rico-*`, `--rico-*`), storage keys, docs, and comments clean and specific to RicoChart.

---

## Pull Request Checklist

Before submitting a PR:

- [ ] Scope is clear and focused on a single issue or feature.
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run lint` passes with zero errors.
- [ ] `npm test` passes, including new tests covering your changes.
- [ ] `npm run build` succeeds cleanly.
- [ ] PR description clearly explains **what** changed, **why**, and **how it was verified**.

---

## License

By contributing to RicoChart, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
