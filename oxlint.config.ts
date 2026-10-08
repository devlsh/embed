import { defineConfig } from 'oxlint';
import preset from '@devlsh/tools/oxlint';

export default defineConfig({
  extends: [preset],
  plugins: ['vue'],
  ignorePatterns: ['/CHANGELOG.md', 'dist/**'],
  rules: {
    'import/extensions': [
      'error',
      {
        pattern: { '.vue': 'never' },
      },
    ],
  },
  overrides: [
    {
      files: ['*.config.ts'],
      rules: {
        'import/extensions': 'off',
      },
    },
  ],
});
