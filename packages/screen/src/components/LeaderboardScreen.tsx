// === Liderlik Tablosu Ekranı ===
// Kayıtlı kullanıcıların kazanma istatistiklerini gösterir.
// Veriyi sunucudan REST API ile çeker.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntry } from '@partyboard/shared';

interface LeaderboardScreenProps {
  onClose: () => void;
}

// Sunucu adresi — production'da VITE_SERVER_URL env değişkeninden gelir
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function LeaderboardScreen({ onClose }: LeaderboardScreenProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'monopoly' | 'rock-paper-scissors'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = filter === 'all'
      ? `${SERVER_URL}/api/leaderboard`
      : `${SERVER_URL}/api/leaderboard?gameId=${filter}`;

    fetch(url)
      .then((r) => r.json())
      .then((data: LeaderboardEntry[]) => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="leaderboard-screen">
      <div className="leaderboard-header">
        <h2>🏆 {t('leaderboard.title')}</h2>
        <button className="leaderboard-close" onClick={onClose}>✕</button>
      </div>

      {/* Filtre butonları */}
      <div className="leaderboard-filters">
        {(['all', 'monopoly', 'rock-paper-scissors'] as const).map((f) => (
          <button
            key={f}
            className={`leaderboard-filter-btn ${filter === f ? 'leaderboard-filter-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? t('leaderboard.allGames')
              : f === 'monopoly' ? t('leaderboard.monopoly')
              : t('leaderboard.rps')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="leaderboard-loading">{t('common.loading')}</p>
      ) : entries.length === 0 ? (
        <p className="leaderboard-empty">{t('leaderboard.noData')}</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>{t('leaderboard.rank')}</th>
              <th>{t('leaderboard.player')}</th>
              <th>{t('leaderboard.wins')}</th>
              <th>{t('leaderboard.played')}</th>
              <th>{t('leaderboard.winRate')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.userId}>
                <td className="lb-rank">
                  {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`}
                </td>
                <td>{e.avatar} {e.username}</td>
                <td>{e.wins}</td>
                <td>{e.gamesPlayed}</td>
                <td>{e.winRate.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
