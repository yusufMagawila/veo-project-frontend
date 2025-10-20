import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from any IP
    port: 5173,      // Default Vite port
    allowedHosts: ['.ngrok-free.app', 'localhost', '127.0.0.1', '0.0.0.0', '*'], // Allow any host
  },
})
