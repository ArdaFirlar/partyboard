// === Kontrolcü (Controller) - Giriş Noktası ===
// React uygulamasını HTML'e bağlayan dosya.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// React uygulamasını "root" div'ine bağla
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
