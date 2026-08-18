import React from 'react';
import { WifiIcon } from '@heroicons/react/24/outline';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkBanner: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium transition-transform duration-300 ${
        !isOnline ? 'bg-red-500 text-white translate-y-0' : 'bg-blue-500 text-white translate-y-0'
      }`}
    >
      <WifiIcon className="w-4 h-4" />
      {!isOnline ? 'Koneksi terputus. Mencoba menghubungkan kembali...' : 'Koneksi kembali pulih.'}
    </div>
  );
};
