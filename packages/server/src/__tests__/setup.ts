// === Jest Kurulum Dosyası ===
// Testler başlamadan önce .env değişkenlerini yükler.
// Bu dosya jest.config'de globalSetup olarak tanımlanır.

import dotenv from 'dotenv';
import path from 'path';

// .env dosyasını bul ve yükle (server paketinin 3 üst dizininde)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
