import React, { useState } from 'react';
import { IonContent, IonPage, useIonAlert, useIonToast, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router';
import { UserCircleIcon, PlusIcon, ArrowRightOnRectangleIcon, CalendarDaysIcon, StopCircleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TourSession } from '../types';

const GuideDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<TourSession[]>([]);
  const history = useHistory();
  const { guide, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();

  useIonViewWillEnter(() => {
    loadSessions();
  });

  const loadSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data || []);
    } catch (e) {
      console.error('Failed to load sessions', e);
      setSessions([]);
    }
  };

  const handleEndSession = (e: React.MouseEvent, sessionId: string, title: string) => {
    e.stopPropagation(); // jangan trigger navigasi ke detail
    presentAlert({
      header: 'Akhiri Sesi?',
      message: `Sesi "${title}" akan diakhiri permanen dan semua peserta dikeluarkan.`,
      buttons: [
        'Batal',
        {
          text: 'Akhiri Sesi',
          role: 'destructive',
          handler: async () => {
            try {
              await api.post(`/sessions/${sessionId}/end`);
              present({ message: 'Sesi telah diakhiri', duration: 2000, color: 'success' });
              loadSessions();
            } catch {
              present({ message: 'Gagal mengakhiri sesi', duration: 2000, color: 'danger' });
            }
          }
        }
      ]
    });
  };

  const statusLabel = (status: string) => {
    if (status === 'ACTIVE') return { label: 'LIVE', cls: 'bg-red-50 text-red-600' };
    if (status === 'ENDED') return { label: 'Selesai', cls: 'bg-zinc-100 text-zinc-500' };
    return { label: 'Terjadwal', cls: 'bg-blue-50 text-blue-700' };
  };

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#ffffff' }}>
        <div className="flex flex-col min-h-full">
          
          {/* Header Profile */}
          <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">{guide?.name || 'Loading...'}</h2>
                <p className="text-xs text-zinc-500">{guide?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
              >
                {isDark
                  ? <SunIcon className="w-5 h-5" />
                  : <MoonIcon className="w-5 h-5" />
                }
              </button>
              <button onClick={logout} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 px-6 py-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 text-center shadow-sm">
              <p className="text-lg font-bold text-blue-600">{sessions.filter(s => s.status === 'ACTIVE').length}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Sesi Aktif</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 text-center shadow-sm">
              <p className="text-lg font-bold text-blue-600">
                {sessions.reduce((acc, s) => acc + (s._count?.participants ?? 0), 0)}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Total Peserta</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 text-center shadow-sm">
              <p className="text-lg font-bold text-blue-600">{sessions.length}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Total Sesi</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="px-6 pb-4">
            <button 
              onClick={() => history.push('/guide/create-session')}
              className="btn-primary"
            >
              <PlusIcon className="w-5 h-5" />
              Buat Sesi Baru
            </button>
          </div>

          {/* Sessions List */}
          <div className="px-6 flex-1 pb-6">
            <h3 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-widest">Daftar Sesi</h3>
            
            {sessions.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4 border border-zinc-200 rounded-2xl bg-white border-dashed">Belum ada sesi</p>
            ) : (
              sessions.map(s => {
                const { label, cls } = statusLabel(s.status);
                const isExpired = (s as any).endsAt && new Date() > new Date((s as any).endsAt);
                const canEnd = s.status !== 'ENDED';

                return (
                  <div
                    key={s.id}
                    onClick={() => history.push(`/guide/session/${s.id}`)}
                    className="bg-white border border-zinc-200 rounded-2xl p-4 mb-2 hover:border-blue-500 transition-all cursor-pointer shadow-sm"
                  >
                    {/* Row 1: title + status badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-900 flex-1 mr-2 tracking-wide">{s.title}</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${cls}`}>
                        {label}
                      </span>
                    </div>

                    {/* Row 2: kode akses */}
                    <p className="text-sm font-medium tracking-widest text-blue-600 mb-2">
                      {(s.accessPrefix || 'TOUR')}-{s.id.split('-')[0].toUpperCase()}
                    </p>

                    {/* Row 3: meta info + Akhiri Sesi button */}
                    <div className="flex items-end justify-between">
                      <div className="flex gap-3 text-[10px] text-zinc-500 flex-wrap">
                        <span>👥 {s._count?.participants || 0} peserta</span>
                        {s.location && <span>📍 {s.location}</span>}
                        {(s as any).endsAt && (
                          <span className={`flex items-center gap-0.5 ${isExpired ? 'text-red-500' : 'text-zinc-500'}`}>
                            <CalendarDaysIcon className="w-3 h-3" />
                            {isExpired ? 'Kadaluarsa ' : 'Berakhir '}
                            {new Date((s as any).endsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Akhiri Sesi — hanya tampil jika belum ENDED */}
                      {canEnd && (
                        <button
                          onClick={(e) => handleEndSession(e, s.id, s.title)}
                          className="flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded-xl hover:bg-red-50 transition-colors ml-2 shrink-0"
                        >
                          <StopCircleIcon className="w-3.5 h-3.5" />
                          Akhiri
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GuideDashboard;
