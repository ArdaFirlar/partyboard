// === Faz 3 Auth API Testleri ===
// Kayıt, giriş, misafir token ve profil endpoint'lerini test eder.
// Gerçek Neon PostgreSQL veritabanına bağlanır.

import request from 'supertest';
import dotenv from 'dotenv';
import { createApp } from '../app';

// .env dosyasını yükle (DATABASE_URL, JWT_SECRET için)
dotenv.config({ path: '../../../.env' });

const app = createApp();

// Test sırasında çakışma olmaması için rastgele email üret
const testEmail = `test_${Date.now()}@partyboard.test`;
const testPassword = 'test1234';
const testUsername = 'TestOyuncu';
const testAvatar = '🐱';

let authToken = ''; // Giriş sonrası alınan token

// =============================================================
// KAYIT TESTLERI
// =============================================================
describe('POST /api/auth/register', () => {
  it('Geçerli bilgilerle başarılı kayıt yapabilmeli', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      username: testUsername,
      password: testPassword,
      avatar: testAvatar,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.username).toBe(testUsername);
    expect(res.body.avatar).toBe(testAvatar);
  });

  it('Aynı email ile tekrar kayıt yapılamamalı', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      username: 'BaşkaKişi',
      password: testPassword,
      avatar: testAvatar,
    });

    expect(res.status).toBe(409); // Conflict
    expect(res.body.error).toBeDefined();
  });

  it('Eksik alan gönderilince hata vermeli', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      // username eksik
      password: testPassword,
      avatar: testAvatar,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('Geçersiz email formatında hata vermeli', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'geçersiz-email',
      username: 'BiriKişi',
      password: testPassword,
      avatar: testAvatar,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('Kısa şifrede hata vermeli', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `kisa_${Date.now()}@test.com`,
      username: 'BiriKişi',
      password: '123', // 3 karakter, minimum 6 olmalı
      avatar: testAvatar,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// =============================================================
// GİRİŞ TESTLERI
// =============================================================
describe('POST /api/auth/login', () => {
  it('Doğru bilgilerle giriş yapabilmeli', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.username).toBe(testUsername);

    // Token'ı diğer testler için sakla
    authToken = res.body.token;
  });

  it('Yanlış şifre ile giriş yapılamamalı', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'yanlis_sifre',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('Var olmayan email ile giriş yapılamamalı', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'yok@partyboard.test',
      password: testPassword,
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('Eksik alan gönderilince hata vermeli', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      // password eksik
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// =============================================================
// MİSAFİR TOKEN TESTLERI
// =============================================================
describe('POST /api/auth/guest', () => {
  it('Geçerli bilgilerle misafir token alabilmeli', async () => {
    const res = await request(app).post('/api/auth/guest').send({
      username: 'MisafirOyuncu',
      avatar: '🐶',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.username).toBe('MisafirOyuncu');
    expect(res.body.avatar).toBe('🐶');
  });

  it('Çok kısa isimle misafir token alınamamalı', async () => {
    const res = await request(app).post('/api/auth/guest').send({
      username: 'A', // 1 karakter, minimum 2 olmalı
      avatar: '🐶',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// =============================================================
// /ME ENDPOINT TESTLERI
// =============================================================
describe('GET /api/auth/me', () => {
  it('Geçerli token ile kullanıcı bilgisi alabilmeli', async () => {
    // authToken, giriş testinde ayarlandı
    expect(authToken).toBeTruthy();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe(testUsername);
    expect(res.body.user.isGuest).toBe(false);
  });

  it('Token olmadan /me endpoint erişilememeli', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('Geçersiz token ile /me endpoint erişilememeli', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer sahte.token.burada');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});

// =============================================================
// SAĞLIK KONTROLÜ
// =============================================================
describe('GET /api/health', () => {
  it('Sunucu çalışıyor mesajı vermeli', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
