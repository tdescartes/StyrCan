// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',  // This is necessary for React testing
    globals: true,         // This ensures global test functions are available
  },
});
