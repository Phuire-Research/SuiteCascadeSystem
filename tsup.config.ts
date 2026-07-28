import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    target: 'node18',
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    minify: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
    outExtension() {
      return { js: '.cjs' };
    },
  },
  {
    entry: ['src/main/index.ts'],
    format: ['cjs'],
    target: 'node18',
    platform: 'node',
    outDir: 'dist/main',
    clean: false,
    sourcemap: true,
    minify: false,
    external: ['electron', 'node-pty'],
    outExtension() {
      return { js: '.js' };
    },
  },
  {
    // C918 · THE PTY HOST — its own on-disk script for utilityProcess.fork
    // (dist/main/ptyHost.js). node-pty stays external (N-API prebuilds).
    entry: ['src/main/ptyHost.ts'],
    format: ['cjs'],
    target: 'node18',
    platform: 'node',
    outDir: 'dist/main',
    clean: false,
    sourcemap: true,
    minify: false,
    external: ['electron', 'node-pty'],
    outExtension() {
      return { js: '.js' };
    },
  },
  {
    entry: ['src/preload/index.ts'],
    format: ['cjs'],
    target: 'node18',
    platform: 'node',
    outDir: 'dist/preload',
    clean: false,
    sourcemap: true,
    minify: false,
    external: ['electron'],
    outExtension() {
      return { js: '.js' };
    },
  },
]);
