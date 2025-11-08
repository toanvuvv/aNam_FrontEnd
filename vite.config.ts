import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  preview: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: [
      'daogiolive.up.railway.app',
      '.railway.app', // Cho phép tất cả subdomain của railway.app
      'localhost',
    ],
  },
});

