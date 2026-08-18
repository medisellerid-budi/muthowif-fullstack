import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import { CheckCircleIcon, XCircleIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface GuideData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const SuperadminDashboard: React.FC = () => {
  const [guides, setGuides] = useState<GuideData[]>([]);
  const [loading, setLoading] = useState(true);
  const { guide, logout } = useAuth();
  const history = useHistory();
  const [present] = useIonToast();

  useEffect(() => {
    // Only SUPERADMIN can access
    if (guide && guide.role !== 'SUPERADMIN') {
      history.replace('/guide/dashboard');
      return;
    }
    fetchGuides();
  }, [guide]);

  const fetchGuides = async () => {
    try {
      const res = await api.get('/admin/guides');
      setGuides(res.data.guides);
    } catch (err) {
      present({ message: 'Gagal memuat daftar Muthowif', duration: 3000, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/admin/guides/${id}/${action}`);
      present({ message: `Berhasil di-${action}`, duration: 2000, color: 'success' });
      fetchGuides();
    } catch (err) {
      present({ message: 'Gagal melakukan aksi', duration: 3000, color: 'danger' });
    }
  };

  const handleLogout = () => {
    logout();
    history.replace('/');
  };

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <div className="page-container flex flex-col h-full max-w-lg mx-auto">
          
          {/* Header */}
          <div className="bg-white px-6 py-6 rounded-b-[2rem] shadow-sm mb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-blue-600 tracking-wider mb-1 uppercase">Superadmin Panel</p>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                  <ShieldCheckIcon className="w-7 h-7 text-blue-500" />
                  Approval Akun
                </h1>
              </div>
              <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="px-6 flex-1 pb-6 overflow-y-auto">
            {loading ? (
              <p className="text-center text-zinc-500 py-8">Memuat data...</p>
            ) : guides.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">Belum ada pendaftar.</p>
            ) : (
              <div className="space-y-3">
                {guides.map((g) => {
                  if (g.role === 'SUPERADMIN') return null; // Don't show superadmins in the list
                  
                  const isPending = g.status === 'PENDING';
                  const isApproved = g.status === 'APPROVED';
                  const isRejected = g.status === 'REJECTED';

                  return (
                    <div key={g.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-zinc-900 text-sm">{g.name}</h3>
                          <p className="text-xs text-zinc-500">{g.email}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
                          isPending ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          isApproved ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                          'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {g.status}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          disabled={!isPending}
                          onClick={() => handleAction(g.id, 'approve')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircleIcon className="w-4 h-4" /> Approve
                        </button>
                        <button
                          disabled={!isPending}
                          onClick={() => handleAction(g.id, 'reject')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <XCircleIcon className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default SuperadminDashboard;
