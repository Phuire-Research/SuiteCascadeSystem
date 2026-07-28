import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/renderer/index.html'),
        // SWRM · the Presenter window entry (the GL shader-wrap surface · D1).
        presenter: resolve(__dirname, 'src/renderer/presenter.html'),
      },
    },
    target: 'chrome120',
    sourcemap: true,
    minify: false,
  },
});
