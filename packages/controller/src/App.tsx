// === PartyBoard Kontrolcü (Controller) - Ana Bileşen ===
// Telefonda gösterilen kontrolcü uygulaması.

import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 PartyBoard</h1>
        <p>Kontrolcü</p>
        <div className="status-box">
          <p>✅ Kontrolcü çalışıyor!</p>
          <p className="hint">Faz 1'de buraya oda kodunu girme ekranı eklenecek.</p>
        </div>
      </header>
    </div>
  );
}

export default App;
