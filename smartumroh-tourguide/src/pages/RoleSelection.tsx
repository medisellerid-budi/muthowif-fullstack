import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router';
import { MicrophoneIcon, SpeakerWaveIcon, ChevronRightIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const KaabaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="4" width="14" height="16" rx="1.5" />
    <path d="M5 9h14" />
    <path d="M5 12h14" />
    {/* Door */}
    <path d="M10 20v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
  </svg>
);

const RoleSelection: React.FC = () => {
  const history = useHistory();
  const { isDark, toggle: toggleTheme } = useTheme();

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#ffffff' }}>
        <div className="page-container">
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="absolute top-8 right-6 w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shadow-sm z-10 hover:text-blue-500 hover:border-blue-200 transition-colors"
          >
            {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          {/* Header */}
          <div className="text-center mb-10">
            <div 
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center" 
              style={{ animation: 'float 3s ease-in-out infinite' }}
            >
              <KaabaIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">SmartUmroh</h2>
            <p className="text-sm text-zinc-500 mt-1">Tour Guide System</p>
          </div>

          {/* Card Container */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
            
            {/* Tour Guide Button */}
            <button 
              onClick={() => history.push('/guide/login')} 
              className="w-full bg-white border border-zinc-100 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all group shadow-[0_2px_8px_rgb(0,0,0,0.04)]"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <MicrophoneIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-semibold text-zinc-900">Tour Guide</h3>
                <p className="text-xs text-zinc-600 mt-0.5">Pembimbing / Tour Leader</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-zinc-50 border border-zinc-200 text-zinc-600 mt-2">
                  Perlu Login
                </span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Peserta Button */}
            <button 
              onClick={() => history.push('/participant/join')} 
              className="w-full bg-white border border-zinc-100 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-200 hover:bg-amber-50/30 transition-all group shadow-[0_2px_8px_rgb(0,0,0,0.04)]"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <SpeakerWaveIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-semibold text-zinc-900">Peserta</h3>
                <p className="text-xs text-zinc-600 mt-0.5">Jamaah Umroh</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-blue-50 border border-blue-100 text-blue-700 mt-2 shadow-sm">
                  Tanpa Login
                </span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>

          {/* Footer Info */}
          <p className="text-center text-xs text-zinc-500 mt-6">
            💡 Peserta cukup masukkan kode akses
          </p>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default RoleSelection;
