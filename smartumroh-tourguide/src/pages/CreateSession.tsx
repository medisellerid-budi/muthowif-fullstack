import React, { useState } from 'react';
import { IonContent, IonPage, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import { PlusCircleIcon, MapPinIcon, TagIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const CreateSession: React.FC = () => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [durationDays, setDurationDays] = useState(9); // Default 9 hari (durasi umroh)
  const history = useHistory();
  const [present] = useIonToast();
  const { isDark, toggle: toggleTheme } = useTheme();

  const DURATION_OPTIONS = [3, 5, 7, 9, 10, 14, 30];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sessions', { title, location, durationDays });
      present({ message: 'Sesi berhasil dibuat! 🎉', duration: 2000, color: 'success' });
      history.replace('/guide/dashboard');
    } catch (e) {
      present({ message: 'Gagal membuat sesi. Coba lagi.', duration: 2000, color: 'danger' });
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#ffffff' }}>
        <div className="page-container">

          {/* Back Button */}
          <button
            onClick={() => history.goBack()}
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

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <PlusCircleIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-heading">Buat Sesi Tour</h2>
            <p className="text-content">Isi detail sesi yang akan dimulai</p>
          </div>

          {/* Form Card */}
          <div className="card-container">
            <form onSubmit={handleCreate} className="space-y-4">

              {/* Nama Sesi */}
              <div>
                <label className="text-label">Nama Sesi Tour</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <TagIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Umroh Ramadhan 2025"
                    className="input-field"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <label className="text-label">Lokasi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <MapPinIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Masjidil Haram, Makkah"
                    className="input-field"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              {/* Durasi Sesi */}
              <div>
                <label className="text-label">Durasi Sesi</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DURATION_OPTIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationDays(d)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all ${
                        durationDays === d
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-400'
                      }`}
                    >
                      {d} hari
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Sesi berakhir: <span className="text-blue-600 font-medium">
                    {new Date(Date.now() + durationDays * 86400000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </p>
              </div>

              <button
                type="submit"
                disabled={!title}
                className="btn-primary mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Buat Sesi
              </button>
            </form>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateSession;
