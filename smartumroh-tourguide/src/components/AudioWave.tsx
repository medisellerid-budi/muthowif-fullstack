import React from 'react';

interface AudioWaveProps {
  isSpeaking: boolean;
  colorClass?: string;
}

export const AudioWave: React.FC<AudioWaveProps> = ({ isSpeaking, colorClass = 'bg-blue-500' }) => {
  return (
    <div className={`flex items-end gap-1 h-12 mb-8 ${!isSpeaking ? 'opacity-30' : ''}`}>
      <div className={`w-1 ${colorClass} rounded-full`} style={{ height: '30%', animation: isSpeaking ? 'wave 1s infinite' : 'none' }}></div>
      <div className={`w-1 ${colorClass} rounded-full`} style={{ height: '60%', animation: isSpeaking ? 'wave 0.8s infinite 0.1s' : 'none' }}></div>
      <div className={`w-1 ${colorClass} rounded-full`} style={{ height: '100%', animation: isSpeaking ? 'wave 0.6s infinite 0.2s' : 'none' }}></div>
      <div className={`w-1 ${colorClass} rounded-full`} style={{ height: '70%', animation: isSpeaking ? 'wave 0.7s infinite 0.3s' : 'none' }}></div>
      <div className={`w-1 ${colorClass} rounded-full`} style={{ height: '40%', animation: isSpeaking ? 'wave 0.9s infinite 0.4s' : 'none' }}></div>
      <div className={`w-1 ${colorClass} rounded-full`} style={{ height: '80%', animation: isSpeaking ? 'wave 0.7s infinite 0.5s' : 'none' }}></div>
      <div className={`w-1 ${colorClass} rounded-full`} style={{ height: '50%', animation: isSpeaking ? 'wave 0.8s infinite 0.6s' : 'none' }}></div>
    </div>
  );
};
