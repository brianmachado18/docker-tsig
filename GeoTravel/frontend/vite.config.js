import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
  const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080'
  const geoserverProxyTarget = process.env.VITE_GEOSERVER_PROXY_TARGET || 'http://localhost:8081'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/geoserver': {
          target: geoserverProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/geoserver/, '/geoserver'),
        },
      },
    },
  }
})
