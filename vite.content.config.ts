import { resolve } from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  define: {
    'process.env': {}
  },
  build: {
    emptyOutDir: false,
    outDir: resolve(__dirname, 'dist'),
    lib: {
      formats: ['iife'],
      entry: resolve(__dirname, 'src/content/content_script.ts'),
      name: 'contentScript'
    },
    rollupOptions: {
      output: {
        entryFileNames: 'content.global.js',
        extend: true,
      }
    }
  }
})
