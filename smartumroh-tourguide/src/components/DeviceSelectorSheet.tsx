import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface MediaDevice { deviceId: string; label: string; }

interface DeviceSelectorSheetProps {
  onClose: () => void;
  onMicChange: (deviceId: string) => void;
  onSpeakerChange: (deviceId: string) => void;
  selectedMicId: string;
  selectedSpeakerId: string;
}

/**
 * Bottom sheet untuk memilih perangkat audio (mikrofon & speaker).
 * Digunakan bersama di GuideRoom dan ParticipantRoom.
 */
export const DeviceSelectorSheet: React.FC<DeviceSelectorSheetProps> = ({
  onClose, onMicChange, onSpeakerChange, selectedMicId, selectedSpeakerId
}) => {
  const [mics, setMics] = useState<MediaDevice[]>([]);
  const [speakers, setSpeakers] = useState<MediaDevice[]>([]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setMics(
        devices
          .filter(d => d.kind === 'audioinput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }))
      );
      setSpeakers(
        devices
          .filter(d => d.kind === 'audiooutput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${i + 1}` }))
      );
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-8 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900">Pengaturan Perangkat Audio</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-100">
            <XMarkIcon className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Microphone */}
        <DeviceList
          icon={<MicrophoneIcon className="w-4 h-4 text-zinc-500" />}
          label="Mikrofon"
          devices={mics}
          selectedId={selectedMicId}
          emptyText="Tidak ada mikrofon terdeteksi"
          onSelect={onMicChange}
        />

        {/* Speaker */}
        <DeviceList
          icon={<SpeakerWaveIcon className="w-4 h-4 text-zinc-500" />}
          label="Speaker / Headset"
          devices={speakers}
          selectedId={selectedSpeakerId}
          emptyText="Speaker tidak dapat diubah di perangkat ini"
          onSelect={onSpeakerChange}
        />
      </div>
    </div>
  );
};

// ─── Internal sub-component ───────────────────────────────────────────────────
interface DeviceListProps {
  icon: React.ReactNode;
  label: string;
  devices: MediaDevice[];
  selectedId: string;
  emptyText: string;
  onSelect: (deviceId: string) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({ icon, label, devices, selectedId, emptyText, onSelect }) => (
  <div className="mb-5 last:mb-0">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">{label}</p>
    </div>
    <div className="space-y-1.5">
      {devices.length === 0 && (
        <p className="text-xs text-zinc-400 text-center py-2">{emptyText}</p>
      )}
      {devices.map(device => (
        <button
          key={device.deviceId}
          onClick={() => onSelect(device.deviceId)}
          className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-medium border transition-all ${
            selectedId === device.deviceId
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-200'
          }`}
        >
          <span className="mr-2">{selectedId === device.deviceId ? '✓' : '○'}</span>
          {device.label}
        </button>
      ))}
    </div>
  </div>
);
