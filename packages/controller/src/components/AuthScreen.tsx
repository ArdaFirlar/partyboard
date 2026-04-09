// === Giriş / Kayıt / Misafir Ekranı ===
// Kullanıcı oyuna katılmadan önce kimliğini belirler.
// 3 seçenek: Misafir (hızlı giriş), Giriş Yap, Kayıt Ol

import { useState } from 'react';

// Mevcut avatarlar
const AVATARS = ['🐱', '🐶', '🐸', '🐵', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷'];

// Sunucu URL'ini al
// Production: VITE_SERVER_URL env değişkeni kullanılır
// Geliştirme: aynı host, port 3001
const getApiUrl = (): string => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  const host = window.location.hostname;
  return `http://${host}:3001`;
};

// AuthScreen'in dışarıya döndürdüğü kullanıcı bilgisi
export interface AuthResult {
  token: string;
  username: string;
  avatar: string;
  isGuest: boolean;
}

interface AuthScreenProps {
  onAuth: (result: AuthResult) => void;
}

// Hangi sekme aktif
type Tab = 'guest' | 'login' | 'register';

export function AuthScreen({ onAuth }: AuthScreenProps) {
  const [tab, setTab] = useState<Tab>('guest');

  // Misafir formu
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);

  // Giriş formu
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Kayıt formu
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAvatar, setRegAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sunucuya istek at
  const apiPost = async (path: string, body: object): Promise<{ success: boolean; token?: string; username?: string; avatar?: string; error?: string }> => {
    const res = await fetch(`${getApiUrl()}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  // Başarılı girişte token'ı kaydet ve devam et
  const handleSuccess = (token: string, username: string, avatar: string, isGuest: boolean) => {
    localStorage.setItem('partyboard_token', token);
    onAuth({ token, username, avatar, isGuest });
  };

  // --- Misafir Girişi ---
  const handleGuest = async () => {
    if (guestName.trim().length < 2) {
      setError('İsmin en az 2 karakter olmalı.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('guest', { username: guestName.trim(), avatar: guestAvatar });
      if (data.success && data.token) {
        handleSuccess(data.token, data.username!, data.avatar!, true);
      } else {
        setError(data.error || 'Bir hata oluştu.');
      }
    } catch {
      setError('Sunucuya bağlanılamadı. Aynı WiFi ağında mısın?');
    }
    setLoading(false);
  };

  // --- Giriş Yap ---
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setError('Email ve şifre zorunludur.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('login', { email: loginEmail, password: loginPassword });
      if (data.success && data.token) {
        handleSuccess(data.token, data.username!, data.avatar!, false);
      } else {
        setError(data.error || 'Giriş yapılamadı.');
      }
    } catch {
      setError('Sunucuya bağlanılamadı. Aynı WiFi ağında mısın?');
    }
    setLoading(false);
  };

  // --- Kayıt Ol ---
  const handleRegister = async () => {
    if (!regEmail || !regUsername || !regPassword) {
      setError('Tüm alanları doldur.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('register', {
        email: regEmail,
        username: regUsername.trim(),
        password: regPassword,
        avatar: regAvatar,
      });
      if (data.success && data.token) {
        handleSuccess(data.token, data.username!, data.avatar!, false);
      } else {
        setError(data.error || 'Kayıt olunamadı.');
      }
    } catch {
      setError('Sunucuya bağlanılamadı. Aynı WiFi ağında mısın?');
    }
    setLoading(false);
  };

  return (
    <div className="auth-screen">
      <h1 className="auth-title">🎮 PartyBoard</h1>

      {/* Sekme butonları */}
      <div className="auth-tabs">
        <button
          className={`auth-tab ${tab === 'guest' ? 'active' : ''}`}
          onClick={() => { setTab('guest'); setError(''); }}
        >
          👤 Misafir
        </button>
        <button
          className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
          onClick={() => { setTab('login'); setError(''); }}
        >
          🔑 Giriş
        </button>
        <button
          className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
          onClick={() => { setTab('register'); setError(''); }}
        >
          ✨ Kayıt
        </button>
      </div>

      <div className="auth-form">

        {/* --- MİSAFİR SEKMESİ --- */}
        {tab === 'guest' && (
          <>
            <p className="auth-hint">Hesap açmadan hızlıca oyna. Verilerin saklanmaz.</p>

            <div className="input-group">
              <label>İsmin</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Oyun içi ismin..."
                maxLength={20}
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label>Avatar Seç</label>
              <div className="avatar-grid">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    className={`avatar-btn ${guestAvatar === a ? 'selected' : ''}`}
                    onClick={() => setGuestAvatar(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={handleGuest} disabled={loading}>
              {loading ? 'Bağlanıyor...' : '🚀 Misafir Olarak Gir'}
            </button>
          </>
        )}

        {/* --- GİRİŞ SEKMESİ --- */}
        {tab === 'login' && (
          <>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="email@örnek.com"
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label>Şifre</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Şifren..."
                autoComplete="current-password"
              />
            </div>

            <button className="btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : '🔑 Giriş Yap'}
            </button>

            <p className="auth-switch">
              Hesabın yok mu?{' '}
              <span onClick={() => { setTab('register'); setError(''); }}>Kayıt ol</span>
            </p>
          </>
        )}

        {/* --- KAYIT SEKMESİ --- */}
        {tab === 'register' && (
          <>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="email@örnek.com"
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label>Kullanıcı Adı</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="Oyun içi ismin..."
                maxLength={20}
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label>Şifre</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="En az 6 karakter..."
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <label>Avatar Seç</label>
              <div className="avatar-grid">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    className={`avatar-btn ${regAvatar === a ? 'selected' : ''}`}
                    onClick={() => setRegAvatar(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={handleRegister} disabled={loading}>
              {loading ? 'Kaydediliyor...' : '✨ Hesap Oluştur'}
            </button>

            <p className="auth-switch">
              Zaten hesabın var mı?{' '}
              <span onClick={() => { setTab('login'); setError(''); }}>Giriş yap</span>
            </p>
          </>
        )}

        {/* Hata mesajı */}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
