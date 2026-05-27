import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'server/**/*.{test,spec}.{ts,js}',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/**/*.{ts,tsx}',
        'server/**/*.{ts,js}',
      ],
      exclude: [
        'src/test/**',
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'server/**/*.test.*',
        'dist/**',
        'node_modules/**',
      ],
    },
  },
})
