import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Smashlings/' : '/',
  build: {
    target: 'esnext',
  },
}))
