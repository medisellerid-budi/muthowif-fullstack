import { useEffect, useRef, useState } from 'react';

/**
 * Hook untuk mendeteksi status koneksi internet browser.
 *
 * ⚠️ navigator.onLine TIDAK reliable di Android WebView & beberapa mobile browser:
 *   - Bisa false saat pertama load meskipun ada koneksi
 *   - Hanya cek apakah network interface aktif, bukan internet sungguhan
 *
 * Solusi: default ke `true` (optimistic) — banner hanya muncul jika event
 * 'offline' benar-benar diterima dari browser, bukan dari nilai awal onLine.
 *
 * Returns { isOnline, wasOffline }
 * - isOnline:   false hanya saat event 'offline' diterima
 * - wasOffline: true sementara setelah kembali online (untuk banner "kembali pulih")
 */
export const useNetworkStatus = () => {
  // Default `true` agar banner tidak muncul saat pertama load.
  // Banner merah hanya tampil jika event 'offline' sungguhan diterima.
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleOnline = () => {
      clearTimer();
      setIsOnline(true);
      setWasOffline(true);
      // Sembunyikan banner "kembali pulih" setelah 3 detik
      timerRef.current = setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      clearTimer();
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimer();
    };
  }, []);

  return { isOnline, wasOffline };
};
