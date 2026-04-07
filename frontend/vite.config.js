import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/analyze': 'http://localhost:8000',
      '/generate': 'http://localhost:8000',
      '/download': 'http://localhost:8000',
    }
  }
})