import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_API_BASE': JSON.stringify('/api'),
  },
  server: {
    port: 5000,
    host: "0.0.0.0"
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
