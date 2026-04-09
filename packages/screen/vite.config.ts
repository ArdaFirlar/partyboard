import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Ana ekran (screen) için Vite ayarları
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Aynı ağdaki telefonlardan erişim için gerekli
    host: true,
  },
  resolve: {
    alias: {
      // Shared paketinin TypeScript kaynağını doğrudan kullan
      '@partyboard/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
