// === Auth Servisi ===
// Kayıt, giriş ve misafir token işlemlerinin iş mantığı.

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

// JWT payload yapısı
export interface JwtPayload {
  userId: string | null;  // Misafirler için null
  username: string;
  avatar: string;
  isGuest: boolean;
}

// JWT oluştur (1 gün geçerli)
function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}

// JWT doğrula
export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET!;
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

// --- Kayıt ---
export async function register(
  email: string,
  username: string,
  password: string,
  avatar: string,
): Promise<{ token: string; username: string; avatar: string } | { error: string }> {
  // Email zaten kullanılıyor mu?
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Bu email adresi zaten kayıtlı.' };
  }

  // Şifreyi şifrele (10 round bcrypt)
  const passwordHash = await bcrypt.hash(password, 10);

  // Kullanıcıyı veritabanına kaydet
  const user = await prisma.user.create({
    data: { email, username, avatar, passwordHash },
  });

  const token = signToken({
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    isGuest: false,
  });

  return { token, username: user.username, avatar: user.avatar };
}

// --- Giriş ---
export async function login(
  email: string,
  password: string,
): Promise<{ token: string; username: string; avatar: string } | { error: string }> {
  // Kullanıcıyı bul
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: 'Email veya şifre hatalı.' };
  }

  // Şifreyi kontrol et
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: 'Email veya şifre hatalı.' };
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    isGuest: false,
  });

  return { token, username: user.username, avatar: user.avatar };
}

// --- Misafir ---
// Misafirler veritabanına kaydedilmez. Sadece geçici JWT alırlar.
export function createGuestToken(
  username: string,
  avatar: string,
): { token: string; username: string; avatar: string } {
  const token = signToken({
    userId: null,
    username,
    avatar,
    isGuest: true,
  });

  return { token, username, avatar };
}

// --- Profil Güncelleme ---
export async function updateProfile(
  userId: string,
  username: string,
  avatar: string,
): Promise<{ token: string; username: string; avatar: string } | { error: string }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { username, avatar },
  });

  const token = signToken({
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    isGuest: false,
  });

  return { token, username: user.username, avatar: user.avatar };
}
