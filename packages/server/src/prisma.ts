// === Prisma İstemcisi (Singleton) ===
// Uygulama genelinde tek bir Prisma bağlantısı kullanılır.
// Singleton pattern: her import'ta aynı örnek döner.

import { PrismaClient } from '@prisma/client';

// Global'e kaydet (geliştirme ortamında hot-reload sırasında bağlantı patlamasını önler)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'], // Sadece hataları logla
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
