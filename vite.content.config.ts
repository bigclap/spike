import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  build: {
    emptyOutDir: false,
    outDir: resolve(__dirname, 'dist'),
    lib: {
      formats: ['iife'],
      entry: resolve(__dirname, 'src/content/content_script.js'),
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
