// === Monopoly Oyun Sonu İstatistik Ekranı ===
// Oyun bitince kısa süre gösterilir.

import { useTranslation } from 'react-i18next';
import { MonopolyStats } from '@partyboard/shared';

interface StatsScreenProps {
  stats: MonopolyStats;
  onClose: () => void;
}

export function StatsScreen({ stats, onClose }: StatsScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="stats-screen">
      <h2>📊 {t('monopoly.stats.title')}</h2>

      {/* Genel istatistikler */}
      <div className="stats-overview">
        <div className="stats-card">
          <span className="stats-value">{stats.totalTurns}</span>
          <span className="stats-label">{t('monopoly.stats.totalTurns')}</span>
        </div>
        <div className="stats-card">
          <span className="stats-value">{stats.totalDoubles}</span>
          <span className="stats-label">{t('monopoly.stats.doubles')}</span>
        </div>
        <div className="stats-card">
          <span className="stats-value">{stats.totalJailVisits}</span>
          <span className="stats-label">{t('monopoly.stats.jailVisits')}</span>
        </div>
        <div className="stats-card">
          <span className="stats-value">{stats.mostVisitedSquare.name}</span>
          <span className="stats-label">{t('monopoly.stats.mostVisited')} ({stats.mostVisitedSquare.count}×)</span>
        </div>
      </div>

      {/* Oyuncu tablosu */}
      <table className="stats-table">
        <thead>
          <tr>
            <th>{t('monopoly.stats.rank')}</th>
            <th>{t('common.players')}</th>
            <th>{t('monopoly.stats.finalMoney')}</th>
            <th>{t('monopoly.stats.rentCollected')}</th>
            <th>{t('monopoly.stats.rentPaid')}</th>
          </tr>
        </thead>
        <tbody>
          {stats.playerStats
            .sort((a, b) => a.rank - b.rank)
            .map((p) => (
              <tr key={p.id} style={{ opacity: p.isBankrupt ? 0.5 : 1 }}>
                <td style={{ color: p.color, fontWeight: 'bold' }}>
                  {p.rank === 1 ? '🏆' : `#${p.rank}`}
                </td>
                <td>
                  {p.avatar} {p.name}
                  {p.isBankrupt && <span className="stats-bankrupt"> 💸</span>}
                </td>
                <td>${p.finalMoney}</td>
                <td className="stats-positive">+${p.rentCollected}</td>
                <td className="stats-negative">-${p.rentPaid}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <button className="stats-close-btn" onClick={onClose}>
        {t('common.returnLobby')}
      </button>
    </div>
  );
}
