import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Ana ekran (screen) için Vite ayarları
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Aynı ağdaki telefonlardan erişim için gerekli
    host: true,
  },
});
