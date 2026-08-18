import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, useIonToast } from '@ionic/react';
import { useParams, useHistory } from 'react-router';
import { ChevronLeftIcon, MicrophoneIcon, DocumentDuplicateIcon, QrCodeIcon, XMarkIcon, ShareIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { TourSession } from '../types';
import { ParticipantCard } from '../components/ParticipantCard';

const GuideSessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<TourSession | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [expectedParticipants, setExpectedParticipants] = useState<any[]>([]);
  const [tab, setTab] = useState<'online' | 'joined' | 'unjoined'>('joined');
  const [showQR, setShowQR] = useState(false);
  const history = useHistory();
  const [present] = useIonToast();
  const { isDark, toggle: toggleTheme } = useTheme();

  const fetchData = async () => {
    try {
      const res = await api.get('/sessions');
      const s = res.data.find((x: any) => x.id === id);
      setSession(s);

      const [pRes, epRes] = await Promise.all([
        api.get(`/sessions/${id}/participants`),
        api.get(`/sessions/${id}/expected`),
      ]);
      setParticipants(pRes.data);
      setExpectedParticipants(epRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();

    // Smart polling: berhenti saat tab/app tidak aktif, resume saat aktif kembali
    let timer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (timer) return;
      timer = setInterval(fetchData, 5000);
    };

    const stopPolling = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else {
        fetchData(); // Langsung refresh saat kembali aktif
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const handleStart = async () => {
    try {
      const res = await api.post(`/sessions/${id}/start`);
      const token = res.data.livekitToken;
      sessionStorage.setItem('room_token', token);
      localStorage.setItem('guide_name', res.data.session?.guideId || 'Guide'); // nama guide tetap di localStorage (non-sensitive)
      history.push(`/guide/room/${id}`);
    } catch (e) {
      present({ message: 'Gagal memulai sesi', duration: 2000, color: 'danger' });
    }
  };

  const accessCode = session?.id ? session.id.split('-')[0].toUpperCase() : '';
  const fullCode = accessCode ? `UMROH-${accessCode}` : '';
  // Deep-link URL: opens ParticipantJoin with code pre-filled
  const joinUrl = accessCode
    ? `${window.location.origin}/participant/join?code=${accessCode}`
    : '';

  const copyCode = () => {
    navigator.clipboard.writeText(fullCode);
    present({ message: 'Kode berhasil disalin', duration: 1500, color: 'success' });
  };

  const shareSession = async () => {
    const text = `🕌 *Bergabung ke Sesi Umroh*\n\n📍 *${session?.title}*${session?.location ? `\n📌 ${session?.location}` : ''}\n\n*Kode akses:* ${fullCode}\n\nAtau buka link berikut:\n${joinUrl}`;

    // Gunakan Web Share API jika tersedia (native share sheet di Android/iOS)
    if (navigator.share) {
      try {
        await navigator.share({ title: session?.title || 'Sesi Umroh', text, url: joinUrl });
        return;
      } catch { /* user cancelled */ }
    }

    // Fallback: buka WhatsApp langsung
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Real stats from data
  const total = participants.length;
  const online = participants.filter((p: any) => p.isOnline).length;
  const unjoined = expectedParticipants.filter((ep: any) => !ep.hasJoined).length;

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#ffffff' }}>
        <div className="flex flex-col min-h-full">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white transition-colors">
            <div className="flex items-center gap-3">
              <ChevronLeftIcon 
                className="w-5 h-5 text-zinc-500 cursor-pointer stroke-2" 
                onClick={() => history.push('/guide/dashboard')} 
              />
              <h2 className="text-sm font-semibold text-zinc-900">
                {session?.title || 'Detail Sesi'}
              </h2>
            </div>
            
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
          </div>

          {/* Access Code Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl mx-6 mt-4 p-5 text-center shadow-sm">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Kode Akses</p>
            <p className="text-2xl font-bold font-mono text-blue-600 tracking-widest">
              {fullCode || 'LOADING...'}
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <button
                onClick={copyCode}
                className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 hover:text-blue-600 transition-colors"
              >
                <DocumentDuplicateIcon className="w-3 h-3" />
                Salin
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 hover:text-blue-600 transition-colors"
              >
                <QrCodeIcon className="w-3 h-3" />
                Tampilkan QR
              </button>
              <button
                onClick={shareSession}
                className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 hover:text-blue-600 transition-colors"
              >
                <ShareIcon className="w-3 h-3" />
                Bagikan
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 px-6 py-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{online}</p>
              <p className="text-[10px] text-zinc-500">Online</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-zinc-900">{total}</p>
              <p className="text-[10px] text-zinc-500">Total</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-amber-600">{unjoined}</p>
              <p className="text-[10px] text-zinc-500">Belum Join</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex mx-6 mb-4 bg-zinc-100 rounded-2xl p-1.5">
            <button 
              onClick={() => setTab('online')}
              className={`flex-1 text-center py-2.5 text-xs font-medium rounded-xl transition-all ${tab === 'online' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-blue-500'}`}
            >
              Online ({online})
            </button>
            <button 
              onClick={() => setTab('joined')}
              className={`flex-1 text-center py-2.5 text-xs font-medium rounded-xl transition-all ${tab === 'joined' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-blue-500'}`}
            >
              Sudah Join ({total})
            </button>
            <button 
              onClick={() => setTab('unjoined')}
              className={`flex-1 text-center py-2.5 text-xs font-medium rounded-xl transition-all ${tab === 'unjoined' ? 'bg-white text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-blue-500'}`}
            >
              Belum ({unjoined})
            </button>
          </div>

          {/* Participant List — sesuai tab aktif */}
          <div className="px-6 space-y-2 flex-1 pb-6 overflow-y-auto">

            {/* Tab: Online */}
            {tab === 'online' && (
              participants.filter((p: any) => p.isOnline).length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">Tidak ada peserta online saat ini</p>
              ) : (
                participants.filter((p: any) => p.isOnline).map((p: any, i: number) => (
                  <ParticipantCard
                    key={p.id}
                    name={p.name}
                    phoneNumber={`No. ${i + 1}`}
                    status="ONLINE"
                    initial={p.name.charAt(0).toUpperCase()}
                  />
                ))
              )
            )}

            {/* Tab: Sudah Join */}
            {tab === 'joined' && (
              participants.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">Belum ada peserta yang bergabung</p>
              ) : (
                participants.map((p: any, i: number) => (
                  <ParticipantCard
                    key={p.id}
                    name={p.name}
                    phoneNumber={`No. ${i + 1}`}
                    status={p.isOnline ? 'ONLINE' : 'OFFLINE'}
                    initial={p.name.charAt(0).toUpperCase()}
                  />
                ))
              )
            )}

            {/* Tab: Belum Join */}
            {tab === 'unjoined' && (
              <div className="relative h-full flex flex-col">
                {expectedParticipants.length === 0 ? (
                  <div className="text-center py-6 flex-1">
                    <p className="text-xs text-zinc-500">Belum ada daftar peserta terdaftar</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Tambah peserta untuk memudahkan absensi</p>
                    <button
                      onClick={() => history.push(`/guide/session/${id}/expected`)}
                      className="mt-4 mx-auto px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-200"
                    >
                      + Tambah Peserta Terdaftar
                    </button>
                  </div>
                ) : expectedParticipants.filter((ep: any) => !ep.hasJoined).length === 0 ? (
                  <div className="text-center py-6 flex-1">
                    <p className="text-xs text-blue-600 font-medium">✅ Semua peserta sudah bergabung!</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-2">
                    {expectedParticipants.filter((ep: any) => !ep.hasJoined).map((ep: any) => (
                      <div key={ep.id} className="flex items-center gap-3 bg-white border border-amber-100 rounded-2xl px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-sm font-bold text-amber-600">
                          {ep.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-zinc-800">{ep.name}</p>
                          {ep.email && <p className="text-[10px] text-zinc-400">{ep.email}</p>}
                        </div>
                        <span className="text-[9px] font-medium bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">
                          Belum Join
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Button Float */}
                {expectedParticipants.length > 0 && session?.status !== 'ENDED' && (
                  <div className="absolute bottom-4 right-0">
                    <button
                      onClick={() => history.push(`/guide/session/${id}/expected`)}
                      className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
                      title="Edit Daftar Peserta"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Start Broadcast Button */}
          {session?.status !== 'ENDED' && (
            <div className="px-6 py-4 bg-white border-t border-zinc-100">
              <button 
                onClick={handleStart}
                className="btn-primary"
              >
                <MicrophoneIcon className="w-5 h-5" />
                {session?.status === 'ACTIVE' ? 'Kembali ke Siaran' : 'Mulai Broadcast'}
              </button>
            </div>
          )}

        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQR(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 mx-6 w-full max-w-xs shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Scan untuk Bergabung</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Arahkan kamera ke QR Code ini</p>
                </div>
                <button
                  onClick={() => setShowQR(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex items-center justify-center bg-white rounded-2xl p-4 border border-zinc-100">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#059669"
                  level="M"
                  includeMargin={false}
                  imageSettings={{
                    src: '',
                    x: undefined,
                    y: undefined,
                    height: 0,
                    width: 0,
                    excavate: false,
                  }}
                />
              </div>

              {/* Code below QR */}
              <div className="mt-4 text-center">
                <p className="text-xs text-zinc-500 mb-1">Atau ketik kode secara manual:</p>
                <p className="text-lg font-bold font-mono text-blue-600 tracking-widest">{fullCode}</p>
              </div>

              {/* Share hint */}
              <p className="text-[10px] text-zinc-400 text-center mt-3">
                Screenshot QR ini dan bagikan ke peserta
              </p>
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default GuideSessionDetail;
