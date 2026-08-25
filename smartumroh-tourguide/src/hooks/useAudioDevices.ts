import { useState } from 'react';
import type { Room } from 'livekit-client';

/**
 * Hook untuk mengelola state dan handler pemilihan perangkat audio (mic & speaker).
 * Bekerja dengan LiveKit room untuk switch device aktif.
 */
export const useAudioDevices = (room: Room) => {
  const [selectedMicId, setSelectedMicId] = useState('default');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('default');

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

  return { selectedMicId, selectedSpeakerId, handleMicChange, handleSpeakerChange };
};
