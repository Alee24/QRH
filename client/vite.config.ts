import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const CLIENT_PORT = Number(process.env.PORT) || 8967;
const SERVER_PORT = Number(process.env.SERVER_PORT) || 8966;

export default defineConfig({
  plugins: [react()],
  server: {
    port: CLIENT_PORT,
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
      },
      '/socket.io': {
        target: `http://localhost:${SERVER_PORT}`,
        ws: true,
      },
    },
  },
});

