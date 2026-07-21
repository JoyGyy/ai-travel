import process from 'node:process'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 5181,
      proxy: {
        '/api': {
          target: 'http://localhost:3030',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'import.meta.env.VITE_IMAGE_BASE_URL': JSON.stringify(env.IMAGE_BASE_URL || ''),
    },
  }
})
