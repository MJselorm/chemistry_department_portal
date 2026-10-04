import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy so the browser calls /api/... and Vite forwards to FastAPI.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) =>
          path.startsWith('/api/directory') ||
          path.startsWith('/api/resources') ||
          path.startsWith('/api/events')
            ? path
            : path.replace(/^\/api/, ''),
      },
    },
  },
})
