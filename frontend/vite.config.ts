import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    // msw/node는 절대 주소만 가로챈다. 가짜 서버 경로는 '*/api/...'라 어느 주소든 맞는다
    env: { VITE_API_BASE: 'http://localhost/api' },
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
  },
})
