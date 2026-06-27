import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    proxy: {
      '/guia-api': {
        target: 'https://2234prd-plan.cloudmv.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/guia-api/, '/mvsaudeweb/messagebroker/gm'),
      },
    },
  },
})
