// === Auth Middleware (Ara Katman) ===
// Korunan endpoint'lere gelen isteklerin JWT token'ını doğrular.
// "Bearer <token>" formatında Authorization header'ı beklenir.

import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from './authService';

// Express Request tipini genişlet — doğrulanmış kullanıcıyı req.user'a ekle
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Token doğrulama middleware'i
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Giriş yapman gerekiyor.' });
    return;
  }

  const token = authHeader.slice(7); // "Bearer " kısmını çıkar
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    return;
  }

  req.user = payload;
  next();
}
