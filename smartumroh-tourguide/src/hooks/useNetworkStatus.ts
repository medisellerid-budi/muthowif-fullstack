import { useEffect, useState } from 'react';

/**
 * Hook untuk mendeteksi status koneksi internet.
 * Returns { isOnline, wasOffline }
 * - isOnline: status koneksi saat ini
 * - wasOffline: true jika sebelumnya offline (berguna untuk menampilkan banner "kembali online")
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Reset "wasOffline" setelah 3 detik (cukup untuk tampilkan banner)
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
};
