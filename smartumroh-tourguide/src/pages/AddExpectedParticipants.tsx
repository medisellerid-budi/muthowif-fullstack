import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, useIonToast, useIonAlert } from '@ionic/react';
import { useHistory, useParams } from 'react-router';
import { ChevronLeftIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';

interface ParticipantForm {
  name: string;
  email: string;
}

const AddExpectedParticipants: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [sessionTitle, setSessionTitle] = useState('Loading...');
  const [participants, setParticipants] = useState<ParticipantForm[]>([{ name: '', email: '' }]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Ambil detail sesi dan data yang sudah ada
    const fetchData = async () => {
      try {
        const sessionRes = await api.get('/sessions');
        const s = sessionRes.data.find((x: any) => x.id === id);
        if (s) setSessionTitle(s.title);

        const expectedRes = await api.get(`/sessions/${id}/expected`);
        if (expectedRes.data && expectedRes.data.length > 0) {
          setParticipants(
            expectedRes.data.map((ep: any) => ({
              name: ep.name,
              email: ep.email || '',
            }))
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [id]);

  const addRow = () => {
    setParticipants([...participants, { name: '', email: '' }]);
  };

  const removeRow = (index: number) => {
    if (participants.length === 1) {
      setParticipants([{ name: '', email: '' }]);
      return;
    }
    const newParticipants = [...participants];
    newParticipants.splice(index, 1);
    setParticipants(newParticipants);
  };

  const updateParticipant = (index: number, field: keyof ParticipantForm, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index][field] = value;
    setParticipants(newParticipants);
  };

  const handleSave = async () => {
    // Filter out baris yang kosong
    const validParticipants = participants.filter((p) => p.name.trim() !== '');

    if (validParticipants.length === 0) {
      presentAlert({
        header: 'Daftar Kosong',
        message: 'Masukkan setidaknya satu nama peserta.',
        buttons: ['OK'],
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.post(`/sessions/${id}/expected`, {
        participants: validParticipants,
      });

      present({ message: 'Daftar peserta berhasil disimpan', duration: 2000, color: 'success' });
      history.goBack();
    } catch (error) {
      console.error(error);
      present({ message: 'Gagal menyimpan data', duration: 3000, color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="bg-zinc-50">
        <div className="flex flex-col min-h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-3 bg-white sticky top-0 z-10">
            <ChevronLeftIcon
              className="w-5 h-5 text-zinc-500 cursor-pointer stroke-2"
              onClick={() => history.goBack()}
            />
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Peserta Terdaftar</h2>
              <p className="text-[10px] text-zinc-500">{sessionTitle}</p>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 px-6 py-6 space-y-4 max-w-lg mx-auto w-full">
            <div className="mb-4">
              <p className="text-sm text-zinc-600">
                Masukkan daftar nama jamaah. Mereka akan ditandai saat berhasil bergabung ke sesi.
              </p>
            </div>

            {participants.map((p, index) => (
              <div key={index} className="flex items-start gap-2 bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Nama Peserta (Wajib)"
                    className="w-full text-sm border-b border-zinc-100 pb-1 focus:outline-none focus:border-blue-500 placeholder-zinc-300"
                    value={p.name}
                    onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder="Email (Opsional)"
                    className="w-full text-xs text-zinc-500 border-none focus:outline-none placeholder-zinc-300"
                    value={p.email}
                    onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                  />
                </div>
                <button
                  onClick={() => removeRow(index)}
                  className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}

            <button
              onClick={addRow}
              className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <PlusIcon className="w-4 h-4 stroke-2" />
              Tambah Baris
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-zinc-100 sticky bottom-0 z-10">
            <button onClick={handleSave} disabled={isSaving} className="btn-primary">
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckIcon className="w-5 h-5 stroke-2" />
                  Simpan Daftar Peserta
                </>
              )}
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddExpectedParticipants;
