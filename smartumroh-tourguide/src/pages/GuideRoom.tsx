import React from 'react';
import { IonContent, IonPage, useIonAlert } from '@ionic/react';
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useParticipants, useRoomContext } from '@livekit/components-react';
import '@livekit/components-styles';
import { useParams, useHistory } from 'react-router';
import { MicrophoneIcon, HandRaisedIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { SpeakerXMarkIcon, SpeakerWaveIcon, PhoneXMarkIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';
import { StatusIndicator } from '../components/StatusIndicator';
import { AudioWave } from '../components/AudioWave';
import { useRaiseHand } from '../hooks/useRaiseHand';
import { useLocalRecording } from '../hooks/useLocalRecording';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { StopCircleIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// ─── Device Selector Component ───────────────────────────────────────────────
interface MediaDevice { deviceId: string; label: string; }

interface DeviceSelectorSheetProps {
  onClose: () => void;
  onMicChange: (deviceId: string) => void;
  onSpeakerChange: (deviceId: string) => void;
  selectedMicId: string;
  selectedSpeakerId: string;
}

const DeviceSelectorSheet: React.FC<DeviceSelectorSheetProps> = ({
  onClose, onMicChange, onSpeakerChange, selectedMicId, selectedSpeakerId
}) => {
  const [mics, setMics] = React.useState<MediaDevice[]>([]);
  const [speakers, setSpeakers] = React.useState<MediaDevice[]>([]);

  React.useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const micList = devices
        .filter(d => d.kind === 'audioinput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }));
      const speakerList = devices
        .filter(d => d.kind === 'audiooutput')
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${i + 1}` }));
      setMics(micList);
      setSpeakers(speakerList);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-8 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">Pengaturan Perangkat Audio</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-100">
            <XMarkIcon className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Microphone */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <MicrophoneIcon className="w-4 h-4 text-zinc-500" />
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Mikrofon</p>
          </div>
          <div className="space-y-1.5">
            {mics.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-2">Tidak ada mikrofon terdeteksi</p>
            )}
            {mics.map(mic => (
              <button
                key={mic.deviceId}
                onClick={() => onMicChange(mic.deviceId)}
                className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-medium border transition-all ${
                  selectedMicId === mic.deviceId
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-200'
                }`}
              >
                <span className="mr-2">{selectedMicId === mic.deviceId ? '✓' : '○'}</span>
                {mic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speaker */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SpeakerWaveIcon className="w-4 h-4 text-zinc-500" />
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Speaker / Headset</p>
          </div>
          <div className="space-y-1.5">
            {speakers.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-2">Speaker tidak dapat diubah di perangkat ini</p>
            )}
            {speakers.map(spk => (
              <button
                key={spk.deviceId}
                onClick={() => onSpeakerChange(spk.deviceId)}
                className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-medium border transition-all ${
                  selectedSpeakerId === spk.deviceId
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-200'
                }`}
              >
                <span className="mr-2">{selectedSpeakerId === spk.deviceId ? '✓' : '○'}</span>
                {spk.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Inner UI (needs LiveKit context) ────────────────────────────────────────
const CustomRoomUI: React.FC<{ onHangup: () => void; guideName: string }> = ({ onHangup, guideName }) => {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const participants = useParticipants();
  const listenerCount = Math.max(0, participants.length - 1);

  // Device selector state
  const [showDeviceSelector, setShowDeviceSelector] = React.useState(false);
  const [selectedMicId, setSelectedMicId] = React.useState('default');
  const [selectedSpeakerId, setSelectedSpeakerId] = React.useState('default');

  const handleMicChange = async (deviceId: string) => {
    setSelectedMicId(deviceId);
    try {
      await room.switchActiveDevice('audioinput', deviceId);
    } catch (e) {
      console.error('Failed to switch mic:', e);
    }
  };

  const handleSpeakerChange = async (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
    try {
      await room.switchActiveDevice('audiooutput', deviceId);
    } catch (e) {
      console.error('Failed to switch speaker:', e);
    }
  };

  const {
    queue, questionsOpen,
    callParticipant, clearFromQueue,
    openQuestions, closeQuestions,
  } = useRaiseHand(guideName, true);

  const toggleMic = () => {
    if (localParticipant) localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const { isRecording, startRecording, stopRecording } = useLocalRecording(room);

  // Keep screen awake while in room
  React.useEffect(() => {
    KeepAwake.keepAwake().catch(console.error);
    return () => {
      KeepAwake.allowSleep().catch(console.error);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <StatusIndicator label="LIVE" colorClass="text-red-500" pulseColorClass="bg-red-500" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {listenerCount > 0 ? `${listenerCount} mendengarkan` : 'Menunggu peserta...'}
            </span>
            <button
              onClick={() => setShowDeviceSelector(true)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              title="Pengaturan Audio"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Record status bar */}
        {isRecording && (
          <div className="mt-2 bg-red-50 rounded-xl px-3 py-1.5 flex items-center justify-center gap-2 border border-red-100 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">Perekaman Aktif</span>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 pb-4">
        <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-50">
          <MicrophoneIcon className="w-10 h-10 text-blue-600" />
        </div>

        <h2 className="text-base font-semibold text-zinc-900 mb-1">Sedang Broadcast</h2>
        <p className="text-xs text-zinc-500 mb-5">Suara Anda dikirim ke semua peserta</p>

        <AudioWave isSpeaking={isMicrophoneEnabled} colorClass="bg-blue-500" />

        {/* Mic + Hangup controls */}
        <div className="flex gap-5 mt-6">
          {/* Mic toggle */}
          <button
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg ${
              isMicrophoneEnabled
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                : 'bg-zinc-600 hover:bg-zinc-700 shadow-zinc-100'
            }`}
          >
            {isMicrophoneEnabled
              ? <SpeakerWaveIcon className="w-6 h-6 text-white" />
              : <SpeakerXMarkIcon className="w-6 h-6 text-white" />
            }
          </button>

          {/* Hangup — keluar sementara */}
          <button
            onClick={onHangup}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg shadow-red-100"
          >
            <PhoneXMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Toggle Record & Questions */}
        <div className="mt-6 w-full max-w-xs space-y-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium border transition-all ${
              isRecording
                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {isRecording ? <StopCircleIcon className="w-5 h-5 text-red-500" /> : <PlayCircleIcon className="w-5 h-5" />}
            {isRecording ? 'Hentikan Perekaman' : 'Mulai Perekaman (Lokal)'}
          </button>

          <button
            onClick={questionsOpen ? closeQuestions : openQuestions}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium border transition-all ${
              questionsOpen
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-400'
            }`}
          >
            <HandRaisedIcon className="w-4 h-4" />
            {questionsOpen ? '✕ Tutup Sesi Pertanyaan' : '✋ Buka Sesi Pertanyaan'}
          </button>
        </div>
      </div>

      {/* Raise Hand Queue */}
      {questionsOpen && (
        <div className="border-t border-zinc-100 px-4 py-3 bg-amber-50 max-h-56 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <HandRaisedIcon className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-semibold text-amber-700">
              {queue.length === 0 ? 'Menunggu pertanyaan...' : `Antrian (${queue.length})`}
            </p>
          </div>
          {queue.length === 0 ? (
            <p className="text-[11px] text-amber-600 text-center py-2">Peserta dapat angkat tangan untuk bertanya</p>
          ) : (
            <div className="space-y-2">
              {queue.map((entry, i) => (
                <div key={entry.name} className={`flex items-center gap-2 bg-white rounded-2xl px-3 py-2 border ${entry.called ? 'border-blue-300' : 'border-zinc-100'}`}>
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700">{i + 1}</span>
                  <span className="flex-1 text-xs font-medium text-zinc-800">{entry.name}</span>
                  {entry.called ? (
                    <>
                      <span className="text-[10px] text-blue-600 font-medium mr-1">🎙️ Berbicara</span>
                      <button onClick={() => clearFromQueue(entry.name)} className="p-1 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => callParticipant(entry.name)} className="p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors">
                      <HandRaisedIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
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

// ─── Main component ─────────────────────────────────────────────────────────
const GuideRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const token = sessionStorage.getItem('room_token');
  const guideName = localStorage.getItem('guide_name') || 'Guide';
  const [presentAlert] = useIonAlert();

  // ── Android: RECORD_AUDIO runtime permission check ────────────────────────
  // AndroidManifest has the permission declared, but Android 6+ requires
  // the user to explicitly grant it at runtime via getUserMedia prompt.
  const [micPermission, setMicPermission] = React.useState<'checking' | 'granted' | 'denied'>('checking');

  React.useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // Stop the tracks immediately — we just needed to trigger permission
        stream.getTracks().forEach(t => t.stop());
        setMicPermission('granted');
      })
      .catch(() => setMicPermission('denied'));
  }, []);

  const handleHangup = () => {
    presentAlert({
      header: 'Keluar dari Room?',
      message: 'Sesi tetap aktif. Anda bisa kembali broadcast kapan saja.',
      buttons: [
        'Batal',
        {
          text: 'Keluar',
          handler: async () => {
            try {
              await api.post(`/sessions/${id}/leave`);
            } catch {}
            sessionStorage.removeItem('room_token');
            history.replace('/guide/dashboard');
          }
        }
      ]
    });
  };

  // ── Android: intercept hardware back button ───────────────────────────────
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = App.addListener('backButton', () => {
      handleHangup();
    });
    return () => { listenerPromise.then(l => l.remove()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return (
      <IonPage>
        <IonContent>
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">Token tidak ditemukan.</div>
        </IonContent>
      </IonPage>
    );
  }

  // ── Mic permission denied — show error before entering LiveKit ────────────
  if (micPermission === 'denied') {
    return (
      <IonPage>
        <IonContent fullscreen>
          <div className="flex flex-col items-center justify-center h-full px-8 bg-white">
            <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mb-5">
              <MicrophoneIcon className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-base font-semibold text-zinc-800 mb-2 text-center">Izin Mikrofon Ditolak</h2>
            <p className="text-xs text-zinc-500 mb-6 text-center">
              Aplikasi memerlukan akses mikrofon untuk broadcast. Buka pengaturan aplikasi dan izinkan akses mikrofon.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full max-w-xs py-3 rounded-2xl font-semibold text-sm bg-blue-600 text-white mb-3"
            >
              🔄 Coba Lagi
            </button>
            <button
              onClick={() => history.replace('/guide/dashboard')}
              className="w-full max-w-xs py-2.5 rounded-2xl font-medium text-sm text-zinc-500 border border-zinc-200"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (micPermission === 'checking') {
    return (
      <IonPage>
        <IonContent fullscreen>
          <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
            Memeriksa izin mikrofon...
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#ffffff' }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <LiveKitRoom
            video={false}
            audio={true}
            token={token}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880'}
            connect={true}
          >
            <CustomRoomUI onHangup={handleHangup} guideName={guideName} />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GuideRoom;
