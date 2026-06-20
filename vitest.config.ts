import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'src/generated'],
    // Cycle v3.4: PostgreSQL migration — vitest needs a valid postgresql://
    // DATABASE_URL to load src/lib/db.ts (which rejects non-postgresql).
    // This placeholder is never actually connected to — tests mock prisma or
    // use it only for type-level imports. Actual DB connection requires a
    // real PostgreSQL instance set via .env or shell env.
    env: {
      DATABASE_URL: 'postgresql://placeholder:placeholder@localhost:5432/test?sslmode=disable',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
