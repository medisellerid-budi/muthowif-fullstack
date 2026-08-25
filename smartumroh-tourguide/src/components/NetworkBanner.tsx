import React from 'react';
import { WifiIcon } from '@heroicons/react/24/outline';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const MESSAGE = {
  offline: 'Koneksi internet terputus. Mencoba menghubungkan kembali...',
  restored: 'Koneksi internet kembali pulih.',
} as const;

/**
 * Banner notifikasi status koneksi internet.
 * - Merah: browser offline (tidak ada koneksi internet)
 * - Biru: koneksi baru saja dipulihkan (hilang otomatis setelah 3 detik)
 */
export const NetworkBanner: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  const isVisible = !isOnline || wasOffline;
  const isOffline = !isOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed top-0 left-0 right-0 z-50',
        'px-4 py-2',
        'flex items-center justify-center gap-2',
        'text-xs font-medium text-white',
        'transition-transform duration-300 ease-in-out',
        isOffline ? 'bg-red-500' : 'bg-blue-500',
        isVisible ? 'translate-y-0' : '-translate-y-full',
      ].join(' ')}
    >
      <WifiIcon className="w-4 h-4 shrink-0" />
      <span>{isOffline ? MESSAGE.offline : MESSAGE.restored}</span>
    </div>
  );
};

