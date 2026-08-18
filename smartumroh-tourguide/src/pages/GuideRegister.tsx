import React, { useState } from 'react';
import { IonContent, IonPage, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import { UserCircleIcon, EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GuideRegister: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { login } = useAuth();
  const [present] = useIonToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      present({ message: 'Password dan konfirmasi tidak cocok.', duration: 3000, color: 'danger' });
      return;
    }

    if (password.length < 8) {
      present({ message: 'Password minimal 8 karakter.', duration: 3000, color: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      present({ message: res.data.message || 'Registrasi berhasil. Menunggu approval Admin.', duration: 5000, color: 'success' });
      history.push('/guide/login');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Registrasi gagal. Coba lagi.';
      present({ message: msg, duration: 3000, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#ffffff' }}>
        <div className="page-container">

          {/* Back Button */}
          <button
            onClick={() => history.push('/guide/login')}
            className="absolute top-8 left-6 w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shadow-sm z-10 hover:bg-zinc-50 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
              <UserCircleIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-heading">Daftar Muthowif</h2>
            <p className="text-content">Buat akun untuk mulai mengelola sesi Umroh</p>
          </div>

          {/* Form Card */}
          <div className="card-container">
            <form onSubmit={handleRegister} className="space-y-4">

              {/* Nama */}
              <div>
                <label className="text-label">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <UserIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Ustadz Ahmad"
                    className="input-field"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-label">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <EnvelopeIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    className="input-field"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-label">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <LockClosedIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    className="input-field"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="text-label">Konfirmasi Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <LockClosedIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="Ulangi password"
                    className="input-field"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mendaftarkan...
                  </span>
                ) : 'Daftar Sekarang'}
              </button>

              {/* Link ke Login */}
              <p className="text-center text-xs text-zinc-500 pt-1">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => history.push('/guide/login')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Masuk
                </button>
              </p>
            </form>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default GuideRegister;
