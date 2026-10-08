import { defineConfig } from 'tsdown';

export default defineConfig({
  tsconfig: './tsconfig.build.json',
  entry: {
    index: './src/index.ts',
  },
  deps: { neverBundle: true },
  format: 'esm',
  platform: 'node',
  fixedExtension: true,
  outExtensions: () => ({
    js: '.mjs',
    dts: '.d.ts',
  }),
  minify: true,
  dts: true,
  clean: true,
});
