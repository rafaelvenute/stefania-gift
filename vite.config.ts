import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/stefania-gift/' : './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
}));
