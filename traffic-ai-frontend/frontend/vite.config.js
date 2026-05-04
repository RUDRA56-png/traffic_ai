import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://traffic-ai-fpya.onrender.com', // ✅ changed
        changeOrigin: true,
        secure: true, // ✅ changed
      }
    }
  }
})