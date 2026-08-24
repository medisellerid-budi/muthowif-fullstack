import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, useIonToast } from '@ionic/react';
import { useHistory, useLocation } from 'react-router';
import { SpeakerWaveIcon, UserIcon, KeyIcon, ArrowRightIcon, QrCodeIcon, XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { Device } from '@capacitor/device';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ParticipantJoin: React.FC = () => {
  const location = useLocation();
  const [name, setName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [waiting, setWaiting] = useState(false);       // Mode menunggu sesi aktif
  const [countdown, setCountdown] = useState(5);        // Detik countdown retry
  const waitingRef = useRef(false);                     // Ref agar tetap akurat di dalam interval
  const history = useHistory();
  const [present] = useIonToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const { isDark, toggle: toggleTheme } = useTheme();

  // Ambil Device UUID saat komponen mount
  useEffect(() => {
    Device.getId()
      .then(info => setDeviceId(info.identifier))
      .catch(() => {
        // Fallback: gunakan UUID yang di-generate dan disimpan di localStorage
        let id = localStorage.getItem('_device_uuid');
        if (!id) {
          id = crypto.randomUUID();
          localStorage.setItem('_device_uuid', id);
        }
        setDeviceId(id);
      });
  }, []);

  // Auto-fill code from URL query param (?code=XXXXX) — set when opened from QR deep-link
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      setSessionCode(code.toUpperCase());
    }
  }, [location.search]);

  // Start camera scanner
  const startScan = async () => {
    setCameraError('');
    setScanning(true);
  };

  // When scanning becomes true, initialize ZXing reader
  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    const reader = new BrowserQRCodeReader();
    let mounted = true;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
        if (!mounted) return;
        controlsRef.current = controls;
        if (result) {
          const text = result.getText();
          // Parse deep-link URL or plain code
          try {
            const url = new URL(text);
            const code = url.searchParams.get('code');
            if (code) {
              setSessionCode(code.toUpperCase());
              setScanning(false);
              controls.stop();
              present({ message: `Kode ditemukan: ${code}`, duration: 2000, color: 'success' });
            }
          } catch {
            // Not a URL — strip any PREFIX- before the suffix and use the raw suffix
            // e.g. "TRAVELXYZ-A70780DB" → "A70780DB", "PIBTOUR-A70780" → "A70780"
            const rawCode = text.replace(/^[A-Z0-9]+-/i, '').trim().toUpperCase();
            if (rawCode.length > 0) {
              setSessionCode(rawCode);
              setScanning(false);
              controls.stop();
              present({ message: `Kode ditemukan: ${rawCode}`, duration: 2000, color: 'success' });
            }
          }
        }
      })
      .catch((err: any) => {
        if (!mounted) return;
        setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
        setScanning(false);
      });

    return () => {
      mounted = false;
      controlsRef.current?.stop();
    };
  }, [scanning]);

  const stopScan = () => {
    controlsRef.current?.stop();
    setScanning(false);
  };

  const doJoin = async () => {
    try {
      const res = await api.post('/join', {
        name,
        // Kirim suffix saja (tanpa prefix) — backend mencari berdasarkan UUID suffix
        sessionId: sessionCode.toUpperCase(),
        deviceId,
      });

      // Berhasil masuk — bersihkan waiting state
      waitingRef.current = false;
      setWaiting(false);

      sessionStorage.setItem('participant_room_token', res.data.livekitToken);
      sessionStorage.setItem('participant_name', res.data.participant.name);

      if (res.data.reconnected) {
        present({ message: `Selamat datang kembali, ${res.data.participant.name}!`, duration: 2000, color: 'success' });
      }

      // Kirim browser notification jika app di background
      if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
        new Notification('Sesi Dimulai! 🎙️', {
          body: `Sesi "${res.data.session.title}" sudah aktif. Ketuk untuk masuk.`,
          icon: '/favicon.ico',
        });
      }

      history.push(`/participant/room/${res.data.session.id}`);
    } catch (err: any) {
      const msg: string = err?.response?.data?.error || '';
      const isNotActive = msg.includes('belum aktif');

      if (isNotActive) {
        if (!waitingRef.current) {
          // Pertama kali — aktifkan mode waiting
          setWaiting(true);
        } else {
          // Sudah dalam mode waiting — reset countdown saja
          setCountdown(5);
        }
        return;
      }

      // Error lain — hentikan waiting dan tampilkan pesan
      waitingRef.current = false;
      setWaiting(false);
      present({ message: msg || 'Gagal bergabung. Periksa kembali kode akses.', duration: 3000, color: 'danger' });
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Minta izin notifikasi browser (untuk notif saat app di-background)
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    await doJoin();
  };

  // Auto-retry loop saat dalam mode waiting
  useEffect(() => {
    if (!waiting) return;
    waitingRef.current = true;

    let tick = 5;
    setCountdown(5);

    const interval = setInterval(async () => {
      if (!waitingRef.current) { clearInterval(interval); return; }
      tick -= 1;
      setCountdown(tick);
      if (tick <= 0) {
        tick = 5;
        setCountdown(5);
        await doJoin();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      waitingRef.current = false;
    };
  }, [waiting]);

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#ffffff' }}>
        <div className="page-container">
          
          {/* Back Button */}
          <button 
            onClick={() => history.push('/')}
            className="absolute top-8 left-6 w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shadow-sm z-10"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="absolute top-8 right-6 w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shadow-sm z-10 hover:text-blue-500 hover:border-blue-200 transition-colors"
          >
            {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          {/* ── Smart Wait Overlay ─────────────────────────────────── */}
          {waiting && (
            <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center px-8 text-center">
              {/* Spinner */}
              <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center mb-5 shadow-md">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 mb-1">Menunggu Guide Memulai</h2>
              <p className="text-xs text-zinc-500 mb-5">
                Sesi belum aktif. Anda akan otomatis masuk<br />saat guide memulai broadcast.
              </p>

              {/* Countdown ring */}
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-6 border-2 border-amber-300">
                <span className="text-xl font-bold text-amber-700">{countdown}</span>
              </div>
              <p className="text-[10px] text-zinc-400 mb-6">Mencoba kembali dalam {countdown} detik...</p>

              <button
                onClick={() => { waitingRef.current = false; setWaiting(false); }}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                Batalkan
              </button>
            </div>
          )}
          {/* ─────────────────────────────────────────────────────────── */}

          <div className="flex flex-col justify-center flex-1">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                <SpeakerWaveIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-heading">Gabung Sesi</h2>
              <p className="text-content">Masukkan nama dan kode akses dari tour guide</p>
            </div>

            {/* Form Card */}
            <div className="card-container">
              <form onSubmit={handleJoin} className="space-y-4">
                
                {/* Nama */}
                <div>
                  <label className="text-label">Nama Anda</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <UserIcon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Contoh: Budi Santoso" 
                      className="input-field"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Kode Akses */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-label">Kode Akses</label>
                    <button
                      type="button"
                      onClick={startScan}
                      className="flex items-center gap-1 text-[11px] text-blue-600 font-medium hover:text-blue-700 transition-colors"
                    >
                      <QrCodeIcon className="w-3.5 h-3.5" />
                      Scan QR
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center">
                      <KeyIcon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Contoh: TRAVELXYZ-A70780DB"
                      className="input-field font-mono uppercase tracking-wider"
                      value={sessionCode}
                      onChange={e => {
                        // Accept full code (PREFIX-SUFFIX) or just the suffix (SUFFIX)
                        // Strip any prefix before the last '-' separator
                        const raw = e.target.value.toUpperCase().replace(/^[A-Z0-9]+-/, '');
                        setSessionCode(raw);
                      }}
                      required
                    />
                  </div>
                  {cameraError && (
                    <p className="text-[11px] text-red-500 mt-1">{cameraError}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  className="btn-primary mt-2"
                >
                  <ArrowRightIcon className="w-4 h-4" />
                  Gabung Sesi
                </button>
              </form>
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-zinc-600">Tidak punya kode akses?</p>
              <p className="text-xs text-zinc-500 mt-1">Hubungi tour guide atau pembimbing umroh Anda</p>
            </div>
          </div>
          
        </div>

        {/* QR Scanner Overlay */}
        {scanning && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-10 pb-4">
              <div>
                <p className="text-white font-semibold text-base">Scan QR Code</p>
                <p className="text-white/60 text-xs mt-0.5">Arahkan ke QR Code dari guide</p>
              </div>
              <button
                onClick={stopScan}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Camera view */}
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden bg-zinc-900">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                {/* Viewfinder corners */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-52 h-52 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                    {/* Scan line animation */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400/80 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-white/50 text-xs text-center pb-12">
              Posisikan QR Code di dalam bingkai
            </p>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default ParticipantJoin;
