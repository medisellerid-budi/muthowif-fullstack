import React, { useState } from 'react';
import { IonContent, IonPage, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import { UserCircleIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GuideLogin: React.FC = () => {
  const [email, setEmail] = useState('guide@muthowif.com');
  const [password, setPassword] = useState('password123');
  const history = useHistory();
  const { login } = useAuth();
  const [present] = useIonToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.guide);
      if (res.data.guide.role === 'SUPERADMIN') {
        history.push('/guide/admin');
      } else {
        history.push('/guide/dashboard');
      }
    } catch (err: any) {
      console.error("Login Error details:", err);
      const apiError = err?.response?.data?.error;
      const networkError = err?.message;
      const msg = apiError || `Network/System Error: ${networkError || 'Unknown'}`;
      present({
        message: msg,
        duration: 5000,
        color: 'danger'
      });
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#ffffff' }}>
        <div className="page-container">

          {/* Back Button */}
          <button
            onClick={() => history.push('/')}
            className="absolute top-8 left-6 w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shadow-sm z-10 hover:bg-zinc-50 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
              <UserCircleIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-heading">Login Muthowif</h2>
            <p className="text-content">Masuk untuk mengelola sesi Umroh</p>
          </div>

          {/* Form Card */}
          <div className="card-container">
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Email */}
              <div>
                <label className="text-label">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <EnvelopeIcon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="guide@muthowif.com"
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
                    placeholder="••••••••"
                    className="input-field"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary mt-2"
              >
                Masuk
              </button>

              {/* Link ke Register */}
              <p className="text-center text-xs text-zinc-500 pt-1">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => history.push('/guide/register')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Daftar sekarang
                </button>
              </p>
            </form>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default GuideLogin;
