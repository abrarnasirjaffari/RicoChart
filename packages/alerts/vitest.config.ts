import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rel = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@rico-chart\/events$/, replacement: rel('../events/src/index.ts') },
    ],
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
