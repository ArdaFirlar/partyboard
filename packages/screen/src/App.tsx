// === PartyBoard Ana Ekran (Screen) - Ana Bileşen ===
// TV veya bilgisayar ekranında gösterilen ana uygulama.

import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 PartyBoard</h1>
        <p>Parti oyun platformu</p>
        <div className="status-box">
          <p>✅ Ana ekran çalışıyor!</p>
          <p className="hint">Faz 1'de buraya oda oluşturma ve QR kod eklenecek.</p>
        </div>
      </header>
    </div>
  );
}

export default App;
