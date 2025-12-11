import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Releases の PDF URL
const pdfURL = 'https://github.com/kazumi-sansan/wings-in-bloom-2025/releases/download/v1.0.0/album.pdf';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // ローカル dev で /api/album にアクセスしたら GitHub Releases に中継
      '/api/album': {
        target: pdfURL,
        changeOrigin: true,
        rewrite: () => ''
      }
    }
  }
});
