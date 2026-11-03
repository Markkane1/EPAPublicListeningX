import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'assets': resolve(__dirname, 'src/assets'),
      'components': resolve(__dirname, 'src/components'),
      'context': resolve(__dirname, 'src/context'),
      'examples': resolve(__dirname, 'src/examples'),
      'layouts': resolve(__dirname, 'src/layouts'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})