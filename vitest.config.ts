import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['packages/*/test/**/*.test.ts', 'services/storefront/test/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['services/api/test/**/*.test.ts'],
          testTimeout: 15_000,
        },
      },
    ],
  },
});
