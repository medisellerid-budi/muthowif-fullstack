import { useState, useRef, useCallback } from 'react';
import { Room, Track } from 'livekit-client';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useIonToast } from '@ionic/react';

export function useLocalRecording(room: Room | undefined) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [present] = useIonToast();

  const startRecording = useCallback(async () => {
    if (!room) {
      present({ message: 'Room belum terhubung', duration: 2000, color: 'danger' });
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      const dest = audioContext.createMediaStreamDestination();

      // 1. Dapatkan mikrofon lokal (Guide)
      const localAudioTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
      if (localAudioTrack && localAudioTrack.mediaStreamTrack) {
        const localStream = new MediaStream([localAudioTrack.mediaStreamTrack]);
        const localSource = audioContext.createMediaStreamSource(localStream);
        localSource.connect(dest);
      } else {
        // Fallback jika belum nyala mic di livekit, paksa minta mic
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const fallbackSource = audioContext.createMediaStreamSource(fallbackStream);
        fallbackSource.connect(dest);
      }

      // 2. Dapatkan audio dari semua peserta (jika ada yang tanya)
      room.remoteParticipants.forEach(participant => {
        const remoteAudioTrack = participant.getTrackPublication(Track.Source.Microphone)?.track;
        if (remoteAudioTrack && remoteAudioTrack.mediaStreamTrack) {
          const remoteStream = new MediaStream([remoteAudioTrack.mediaStreamTrack]);
          const remoteSource = audioContext.createMediaStreamSource(remoteStream);
          remoteSource.connect(dest);
        }
      });

      // 3. Mulai perekaman dari hasil gabungan (dest)
      const options = { mimeType: 'audio/webm;codecs=opus' };
      // Fallback untuk iOS/Safari yang mungkin tidak support webm
      const mimeType = MediaRecorder.isTypeSupported(options.mimeType) ? options.mimeType : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(dest.stream, { mimeType: mimeType !== 'audio/mp4' ? mimeType : undefined });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        await saveRecordingToDevice(blob, mimeType);
      };

      mediaRecorder.start(1000); // Kumpulkan data tiap 1 detik
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      present({ message: '⏺️ Perekaman dimulai', duration: 2000, color: 'success' });

    } catch (err) {
      console.error('Recording error:', err);
      present({ message: 'Gagal memulai perekaman', duration: 3000, color: 'danger' });
    }
  }, [room, present]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      present({ message: '⏹️ Menyimpan rekaman...', duration: 2000, color: 'medium' });
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  }, [isRecording, present]);

  const saveRecordingToDevice = async (blob: Blob, mimeType: string) => {
    try {
      // Konversi Blob ke Base64 menggunakan FileReader
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Ambil hanya string base64, buang prefix "data:audio/webm;base64,"
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
      const fileName = `Rekaman_Muthowif_${dateStr}.${ext}`;

      // Simpan menggunakan Capacitor Filesystem ke public Documents
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        // Jika tidak disupport Documents (di Web), fallback akan masuk IndexedDB
      });

      present({ 
        message: `✅ Tersimpan: Documents/${fileName}`, 
        duration: 5000, 
        color: 'success' 
      });
      console.log('Saved recording:', savedFile);

    } catch (err) {
      console.error('Save error:', err);
      // Fallback ke browser download jika Filesystem error (misal di web tanpa plugin)
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rekaman_Muthowif_Web_${new Date().getTime()}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      present({ message: 'Tersimpan lewat browser download.', duration: 3000, color: 'warning' });
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}
