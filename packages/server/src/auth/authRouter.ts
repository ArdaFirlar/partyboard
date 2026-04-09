// === Auth API Rotaları ===
// Kayıt, giriş, misafir ve profil endpoint'leri.
//
// POST /api/auth/register  — Yeni hesap oluştur
// POST /api/auth/login     — Mevcut hesaba giriş yap
// POST /api/auth/guest     — Misafir token'ı al (DB'ye kaydedilmez)
// GET  /api/auth/me        — Mevcut oturumdaki kullanıcı bilgisi
// PUT  /api/auth/profile   — Profil güncelle (kullanıcı adı, avatar)

import { Router, Request, Response } from 'express';
import { register, login, createGuestToken, updateProfile } from './authService';
import { requireAuth } from './authMiddleware';

export const authRouter = Router();

// --- Kayıt ---
authRouter.post('/register', async (req: Request, res: Response) => {
  const { email, username, password, avatar } = req.body;

  // Zorunlu alanları kontrol et
  if (!email || !username || !password || !avatar) {
    res.status(400).json({ error: 'Email, kullanıcı adı, şifre ve avatar zorunludur.' });
    return;
  }

  // Email formatı kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Geçerli bir email adresi gir.' });
    return;
  }

  // Şifre uzunluğu kontrolü
  if (password.length < 6) {
    res.status(400).json({ error: 'Şifre en az 6 karakter olmalı.' });
    return;
  }

  // Kullanıcı adı uzunluğu kontrolü
  if (username.trim().length < 2 || username.trim().length > 20) {
    res.status(400).json({ error: 'Kullanıcı adı 2-20 karakter arasında olmalı.' });
    return;
  }

  try {
    const result = await register(email.trim().toLowerCase(), username.trim(), password, avatar);

    if ('error' in result) {
      res.status(409).json({ error: result.error });
      return;
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Auth] Kayıt hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası. Tekrar dene.' });
  }
});

// --- Giriş ---
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email ve şifre zorunludur.' });
    return;
  }

  try {
    const result = await login(email.trim().toLowerCase(), password);

    if ('error' in result) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Auth] Giriş hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası. Tekrar dene.' });
  }
});

// --- Misafir Token ---
authRouter.post('/guest', (req: Request, res: Response) => {
  const { username, avatar } = req.body;

  if (!username || !avatar) {
    res.status(400).json({ error: 'Kullanıcı adı ve avatar zorunludur.' });
    return;
  }

  if (username.trim().length < 2 || username.trim().length > 20) {
    res.status(400).json({ error: 'İsim 2-20 karakter arasında olmalı.' });
    return;
  }

  const result = createGuestToken(username.trim(), avatar);
  res.json({ success: true, ...result });
});

// --- Ben Kimim (token doğrulama) ---
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ success: true, user: req.user });
});

// --- Profil Güncelle ---
authRouter.put('/profile', requireAuth, async (req: Request, res: Response) => {
  const { username, avatar } = req.body;

  // Misafirler profil güncelleyemez
  if (req.user!.isGuest) {
    res.status(403).json({ error: 'Misafirler profil güncelleyemez.' });
    return;
  }

  if (!username || !avatar) {
    res.status(400).json({ error: 'Kullanıcı adı ve avatar zorunludur.' });
    return;
  }

  if (username.trim().length < 2 || username.trim().length > 20) {
    res.status(400).json({ error: 'Kullanıcı adı 2-20 karakter arasında olmalı.' });
    return;
  }

  try {
    const result = await updateProfile(req.user!.userId!, username.trim(), avatar);

    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Auth] Profil güncelleme hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası. Tekrar dene.' });
  }
});
