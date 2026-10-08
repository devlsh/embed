import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [vue()],
  test: {
    api: { host: '127.0.0.1' },
    globals: true,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    coverage: {
      include: ['src/**/*.ts'],
    },
    setupFiles: ['./tests/setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
