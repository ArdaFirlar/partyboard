// === Bağlantı Kopma Bildirimi ===
// Ekranın üstünde sarı bir banner olarak gösterilir.
// Oda sahibine "Bekle / Elen" seçeneği sunmak bu fazın kapsamı dışında — sadece bildirim.

import { useTranslation } from 'react-i18next';

interface DisconnectBannerProps {
  disconnected: { id: string; name: string }[];
  onDismiss: (id: string) => void;
}

export function DisconnectBanner({ disconnected, onDismiss }: DisconnectBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="disconnect-banner">
      {disconnected.map((p) => (
        <div key={p.id} className="disconnect-banner-item">
          <span>⚠️ {t('disconnect.playerLeft', { name: p.name })}</span>
          <button className="disconnect-dismiss" onClick={() => onDismiss(p.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
