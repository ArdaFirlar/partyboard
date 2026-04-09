/// <reference types="vite/client" />

// Uygulama genelinde kullanılan Vite env değişkenlerinin tip tanımları.
// Bu sayede import.meta.env.VITE_* değişkenleri TypeScript tarafından tanınır.
interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  readonly VITE_CONTROLLER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
