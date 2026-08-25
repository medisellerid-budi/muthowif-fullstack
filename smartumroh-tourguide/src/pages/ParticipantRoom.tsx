import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IonContent, IonPage, useIonAlert } from '@ionic/react';
import { LiveKitRoom, RoomAudioRenderer, useParticipants, useConnectionState, useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import '@livekit/components-styles';
import { useHistory } from 'react-router';
import { UserCircleIcon, UsersIcon, SpeakerWaveIcon, HandRaisedIcon, Cog6ToothIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { SpeakerWaveIcon as SpeakerWaveSolid, ArrowRightOnRectangleIcon, HandRaisedIcon as HandRaisedSolid } from '@heroicons/react/24/solid';
import { StatusIndicator } from '../components/StatusIndicator';
import { AudioWave } from '../components/AudioWave';
import { DeviceSelectorSheet } from '../components/DeviceSelectorSheet';
import { useRaiseHand } from '../hooks/useRaiseHand';
import { useAudioDevices } from '../hooks/useAudioDevices';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// ─── Inner component (needs LiveKit context) ────────────────────────────────
const ParticipantUI: React.FC<{ onLeave: () => void; myName: string }> = ({ onLeave, myName }) => {
  const [tab, setTab] = useState<'listen' | 'people'>('listen');
  const participants = useParticipants();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const connectionState = useConnectionState();

  // Device selector state
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const { selectedMicId, selectedSpeakerId, handleMicChange, handleSpeakerChange } = useAudioDevices(room);

  // Mic state (peserta) — hanya aktif saat dipanggil guide
  const [isMicActive, setIsMicActive] = useState(false);

  // iOS Safari requires a user gesture to start audio playback
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioCheckDone = useRef(false);

  // ── Keep screen awake during session (Android APK + iOS) ─────────────────
  useEffect(() => {
    KeepAwake.keepAwake().catch(console.error);
    return () => { KeepAwake.allowSleep().catch(console.error); };
  }, []);

  // ── Audio unlock: initial check ──────────────────────────────────────────
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || audioCheckDone.current) return;
    audioCheckDone.current = true;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') {
      setAudioBlocked(true);
    }
    ctx.close();
  }, [connectionState]);

  // ── Android APK: App state change (background → foreground) ────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && connectionState === ConnectionState.Connected) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') {
          setAudioBlocked(true);
          audioCheckDone.current = false;
        }
        ctx.close();
      }
    });
    return () => { listenerPromise.then(l => l.remove()); };
  }, [connectionState]);

  // ── iOS: Re-unlock audio when app comes back from background/lock screen ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionState === ConnectionState.Connected) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') {
          setAudioBlocked(true);
          audioCheckDone.current = false;
        }
        ctx.close();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connectionState]);

  const unlockAudio = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    ctx.resume().then(() => { ctx.close(); });
    room.startAudio().then(() => {
      setAudioBlocked(false);
    }).catch(() => {
      setAudioBlocked(false);
    });
  };

  // ── Callback: aktifkan mic saat dipanggil guide ──────────────────────────
  const handleCalled = useCallback(() => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(true).catch(console.error);
    setIsMicActive(true);
  }, [localParticipant]);

  // ── Callback: matikan mic saat panggilan selesai ─────────────────────────
  const handleCallCleared = useCallback(() => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(false).catch(console.error);
    setIsMicActive(false);
  }, [localParticipant]);

  const {
    queue, isHandRaised, myPosition, iAmCalled, questionsOpen,
    raiseHand, lowerHand,
  } = useRaiseHand(myName, false, {
    onCalled: handleCalled,
    onCallCleared: handleCallCleared,
  });


  // Guide = publisher with canPublish permission AND named 'guide'
  const guideParticipant = participants.find(p => !p.isLocal && p.permissions?.canPublish);
  const otherParticipants = participants.filter(p => p !== guideParticipant);

  // ── Reconnecting overlay ──────────────────────────────────────────────────
  if (connectionState === ConnectionState.Reconnecting) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#fafafa] px-8">
        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-5 shadow-sm">
          <svg className="w-8 h-8 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-zinc-800 mb-1 text-center">Menyambungkan Ulang...</h2>
        <p className="text-xs text-zinc-500 text-center">
          Koneksi terputus. LiveKit sedang mencoba menghubungkan kembali. Mohon tunggu sebentar.
        </p>
      </div>
    );
  }

  // ── Disconnected overlay ──────────────────────────────────────────────────
  if (connectionState === ConnectionState.Disconnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#fafafa] px-8">
        <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mb-5 shadow-sm">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-zinc-800 mb-2 text-center">Koneksi Terputus</h2>
        <p className="text-xs text-zinc-500 mb-6 text-center">
          Tidak dapat terhubung ke server. Pastikan koneksi internet Anda stabil, lalu coba lagi.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full max-w-xs py-3 rounded-2xl font-semibold text-sm bg-blue-600 text-white shadow-lg shadow-blue-100 mb-3"
        >
          🔄 Coba Lagi
        </button>
        <button
          onClick={onLeave}
          className="w-full max-w-xs py-2.5 rounded-2xl font-medium text-sm text-zinc-500 border border-zinc-200 bg-white"
        >
          Keluar dari Sesi
        </button>
      </div>
    );
  }

  // ── Audio unlock prompt ───────────────────────────────────────────────────
  if (audioBlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#fafafa] px-8">
        <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mb-6 shadow-sm">
          <SpeakerWaveIcon className="w-9 h-9 text-blue-600" />
        </div>
        <h2 className="text-base font-semibold text-zinc-900 mb-2 text-center">Ketuk untuk Mengaktifkan Suara</h2>
        <p className="text-xs text-zinc-500 mb-6 text-center">
          Perangkat Anda memerlukan izin untuk memutar audio. Ketuk tombol di bawah untuk mendengar suara Guide.
        </p>
        <button
          onClick={unlockAudio}
          className="w-full max-w-xs flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
        >
          <SpeakerWaveSolid className="w-5 h-5" />
          Aktifkan Suara
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-zinc-100 bg-white">
        <StatusIndicator
          label={
            connectionState === ConnectionState.Connected ? 'TERHUBUNG' :
            connectionState === ConnectionState.Connecting ? 'MENGHUBUNGKAN...' :
            'TERPUTUS'
          }
          colorClass={
            connectionState === ConnectionState.Connected ? 'text-blue-600' :
            connectionState === ConnectionState.Connecting ? 'text-amber-500' :
            'text-red-500'
          }
          pulseColorClass={
            connectionState === ConnectionState.Connected ? 'bg-blue-500' :
            connectionState === ConnectionState.Connecting ? 'bg-amber-400' :
            'bg-red-400'
          }
        />
        <div className="flex gap-2 items-center">
          {/* Question session badge */}
          {questionsOpen && (
            <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              ✋ Pertanyaan Terbuka
            </span>
          )}
          {/* Device settings */}
          <button
            onClick={() => setShowDeviceSelector(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            title="Pengaturan Audio"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTab('listen')}
            className={`p-2 rounded-xl transition-colors ${tab === 'listen' ? 'bg-blue-50 text-blue-600' : 'text-zinc-400'}`}
          >
            <SpeakerWaveIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTab('people')}
            className={`relative p-2 rounded-xl transition-colors ${tab === 'people' ? 'bg-blue-50 text-blue-600' : 'text-zinc-400'}`}
          >
            <UsersIcon className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
              {participants.length + 1}
            </span>
          </button>
        </div>
      </div>

      {/* Tab: Listen */}
      {tab === 'listen' && (
        <div className="flex flex-col items-center justify-center flex-1 px-6 pb-6 overflow-y-auto">

          {/* Guide card */}
          <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4 flex items-center gap-3 mb-6 w-full max-w-xs shadow-sm mt-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <UserCircleIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-zinc-900">Tour Guide</p>
              <p className="text-[10px] text-zinc-500">Sedang berbicara...</p>
            </div>
            <SpeakerWaveIcon className="w-5 h-5 text-blue-600" />
          </div>

          <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-50">
            <SpeakerWaveSolid className="w-9 h-9 text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 mb-1">Sedang Mendengarkan</h2>
          <p className="text-xs text-zinc-500 mb-5">Suara guide akan terdengar otomatis</p>

          <AudioWave isSpeaking={true} colorClass="bg-blue-500" />

          {/* Notification: called to speak */}
          {iAmCalled && (
            <div className="mt-4 w-full max-w-xs bg-blue-50 border border-blue-300 rounded-2xl p-4 text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${isMicActive ? 'bg-green-100 animate-pulse' : 'bg-blue-100'}`}>
                <MicrophoneIcon className={`w-6 h-6 ${isMicActive ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <p className="text-sm font-semibold text-blue-700">🎙️ Silakan Anda berbicara!</p>
              <p className="text-xs text-blue-600 mt-0.5">Guide mempersilahkan Anda bertanya</p>
              {isMicActive && (
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-green-600">Mikrofon Aktif</span>
                </div>
              )}
            </div>
          )}

          {/* Queue position for this user */}
          {isHandRaised && !iAmCalled && (
            <div className="mt-4 w-full max-w-xs bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
              <p className="text-sm font-medium text-amber-700">✋ Antrian Anda: No. {myPosition}</p>
              <p className="text-xs text-amber-600 mt-0.5">Tunggu giliran Anda dipanggil</p>
            </div>
          )}

          {/* RAISE HAND SECTION — only shown when guide opens question session */}
          {questionsOpen ? (
            <>
              <button
                onClick={isHandRaised ? lowerHand : raiseHand}
                className={`mt-5 w-full max-w-xs flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm transition-all shadow-sm ${
                  isHandRaised
                    ? 'bg-amber-500 text-white shadow-amber-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                }`}
              >
                {isHandRaised
                  ? <><HandRaisedSolid className="w-5 h-5" /> Turunkan Tangan</>
                  : <><HandRaisedIcon className="w-5 h-5" /> Angkat Tangan untuk Bertanya</>
                }
              </button>

              {/* Queue — visible to all */}
              {queue.length > 0 && (
                <div className="mt-4 w-full max-w-xs">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">Antrian Pertanyaan</p>
                  <div className="space-y-1.5">
                    {queue.map((entry, i) => (
                      <div key={entry.name} className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs border ${
                        entry.called ? 'bg-blue-50 border-blue-200' : 'bg-white border-zinc-100'
                      }`}>
                        <span className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">{i + 1}</span>
                        <span className={`flex-1 font-medium ${entry.name === myName ? 'text-blue-700' : 'text-zinc-700'}`}>
                          {entry.name === myName ? `${entry.name} (Anda)` : entry.name}
                        </span>
                        {entry.called && <span className="text-blue-600 text-[10px] font-medium">🎙️</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Closed state */
            <div className="mt-5 w-full max-w-xs bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-center">
              <HandRaisedIcon className="w-5 h-5 text-zinc-400 mx-auto mb-1" />
              <p className="text-xs text-zinc-500">Sesi pertanyaan belum dibuka</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Tunggu guide membuka sesi tanya-jawab</p>
            </div>
          )}

          {/* Leave */}
          <button onClick={onLeave} className="btn-danger max-w-xs mt-6">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Keluar dari Sesi
          </button>
        </div>
      )}

      {/* Tab: People */}
      {tab === 'people' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-3">
            {participants.length + 1} orang di ruangan ini
          </p>

          {/* Guide */}
          <div className="flex items-center gap-3 bg-white border border-blue-200 rounded-2xl px-4 py-3 mb-2 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">T</div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-zinc-900">Tour Guide</p>
              <p className="text-[10px] text-blue-600">🎙️ Pembicara Utama</p>
            </div>
          </div>

          {/* Remote participants */}
          {otherParticipants.map((p) => (
            <div key={p.sid} className="flex items-center gap-3 bg-white border border-zinc-100 rounded-2xl px-4 py-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-500">
                {p.identity.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-zinc-800">
                  {p.identity}{p.isLocal ? ' (Anda)' : ''}
                </p>
              </div>
              {queue.some(e => e.name === p.identity) && (
                <HandRaisedSolid className="w-4 h-4 text-amber-500" />
              )}
            </div>
          ))}

          {/* Self */}
          {!otherParticipants.find(p => p.identity === myName) && (
            <div className="flex items-center gap-3 bg-white border border-zinc-100 rounded-2xl px-4 py-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-500">
                {myName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-zinc-800">{myName} (Anda)</p>
                {isMicActive && (
                  <p className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Mikrofon aktif
                  </p>
                )}
              </div>
              {isHandRaised && <HandRaisedSolid className="w-4 h-4 text-amber-500" />}
            </div>
          )}
        </div>
      )}

      {/* Device Selector Bottom Sheet */}
      {showDeviceSelector && (
        <DeviceSelectorSheet
          onClose={() => setShowDeviceSelector(false)}
          onMicChange={handleMicChange}
          onSpeakerChange={handleSpeakerChange}
          selectedMicId={selectedMicId}
          selectedSpeakerId={selectedSpeakerId}
        />
      )}
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
const ParticipantRoom: React.FC = () => {
  const history = useHistory();
  const token = sessionStorage.getItem('participant_room_token');
  const myName = sessionStorage.getItem('participant_name') || 'Peserta';
  const [presentAlert] = useIonAlert();

  const handleLeave = () => {
    presentAlert({
      header: 'Keluar?',
      message: 'Apakah Anda yakin ingin keluar dari ruangan ini?',
      buttons: [
        'Batal',
        {
          text: 'Keluar',
          handler: () => {
            sessionStorage.removeItem('participant_room_token');
            sessionStorage.removeItem('participant_name');
            history.replace('/');
          }
        }
      ]
    });
  };

  // ── Android: intercept hardware back button ───────────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = App.addListener('backButton', () => {
      handleLeave();
    });
    return () => { listenerPromise.then(l => l.remove()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return (
      <IonPage>
        <IonContent className="bg-[#fafafa]">
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Token tidak ditemukan.
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#fafafa' }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <LiveKitRoom
            video={false}
            audio={false}
            token={token}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880'}
            connect={true}
          >
            <ParticipantUI onLeave={handleLeave} myName={myName} />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ParticipantRoom;
