import preset from '@devlsh/tools/oxfmt';
import { defineConfig } from 'oxfmt';

export default defineConfig({
  ...preset,
  ignorePatterns: [...preset.ignorePatterns, '/CHANGELOG.md', '.github', 'dist/**', 'pnpm-lock.yaml'],
});
