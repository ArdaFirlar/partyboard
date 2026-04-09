// === Liderlik Tablosu API ===
// GET /api/leaderboard?gameId=monopoly  → belirli oyun
// GET /api/leaderboard                  → tüm oyunlar

import { Router, Request, Response } from 'express';
import { prisma } from './prisma';
import { LeaderboardEntry } from '@partyboard/shared';

export const leaderboardRouter = Router();

leaderboardRouter.get('/', async (req: Request, res: Response) => {
  try {
    const gameId = req.query.gameId as string | undefined;

    // GameResult tablosundan kazanma istatistiklerini topla
    const results = await (prisma as any).gameResult.groupBy({
      by: ['userId'],
      where: gameId ? { gameId } : undefined,
      _count: { id: true },
      _sum: { won: true },
    }) as Array<{ userId: string; _count: { id: number }; _sum: { won: number | null } }>;

    // Kullanıcı bilgilerini çek
    const userIds = results.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatar: true },
    }) as Array<{ id: string; username: string; avatar: string }>;

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Sırala: kazanma sayısı > oran
    const entries: LeaderboardEntry[] = results
      .map((r) => {
        const user = userMap.get(r.userId);
        const wins = r._sum.won ?? 0;
        const played = r._count.id;
        return {
          rank: 0,
          userId: r.userId,
          username: user?.username ?? 'Misafir',
          avatar: user?.avatar ?? '🎮',
          wins,
          gamesPlayed: played,
          winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
          gameId,
        };
      })
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    res.json(entries);
  } catch (err) {
    console.error('[Liderlik] Hata:', err);
    res.json([]);
  }
});
