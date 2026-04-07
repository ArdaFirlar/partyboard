import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Kontrolcü (telefon) için Vite ayarları
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    // Aynı ağdaki telefonlardan erişim için gerekli
    host: true,
  },
});
