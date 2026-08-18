import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useIonToast } from '@ionic/react';

export const PWAPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [presentToast, dismissToast] = useIonToast();

  useEffect(() => {
    if (needRefresh) {
      presentToast({
        message: 'Versi baru tersedia! Klik tombol untuk memperbarui aplikasi.',
        position: 'bottom',
        color: 'primary',
        buttons: [
          {
            text: 'Muat Ulang',
            role: 'info',
            handler: () => {
              updateServiceWorker(true);
            },
          },
          {
            text: 'Nanti',
            role: 'cancel',
            handler: () => {
              setNeedRefresh(false);
              dismissToast();
            },
          },
        ],
        duration: 0, // Stay until clicked
      });
    }
  }, [needRefresh, presentToast, dismissToast, updateServiceWorker, setNeedRefresh]);

  return null;
};
